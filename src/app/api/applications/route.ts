import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from '@/lib/auth'
import { createApplicationSchema, paginationSchema } from '@/lib/validations'
import { validateReferralCode, trackReferralUsage } from '@/lib/referral'
import { sendApplicationSubmitted } from '@/lib/email'
import { ApiResponse } from '@/types'
import { ApplicationStage, UserRole } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    })
    const stage = searchParams.get('stage') as ApplicationStage | null

    const where: Record<string, unknown> = {}

    if (session.user.role === UserRole.CANDIDATE) {
      where.candidateId = session.user.id
    } else if (session.user.role === UserRole.RECRUITER) {
      where.recruiterId = session.user.id
    }
    // Admin sees all

    if (stage) {
      where.stage = stage
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          job: {
            include: {
              company: { select: { id: true, name: true, logo: true } },
            },
          },
          candidate: {
            select: {
              id: true,
              name: true,
              email: true,
              candidateProfile: true,
            },
          },
          recruiter: {
            select: { id: true, name: true, email: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { appliedAt: 'desc' },
      }),
      prisma.application.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        items: applications,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Applications GET error:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session || session.user.role !== UserRole.CANDIDATE) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only candidates can apply for jobs' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = createApplicationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { jobId, referralCode, resumeUrl, notes } = validation.data

    // Check job exists and is active
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { company: true },
    })

    if (!job || !['ACTIVE', 'FEATURED'].includes(job.status)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Job not found or not accepting applications' },
        { status: 404 }
      )
    }

    // Check if already applied
    const existingApp = await prisma.application.findUnique({
      where: { jobId_candidateId: { jobId, candidateId: session.user.id } },
    })

    if (existingApp) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'You have already applied for this job' },
        { status: 409 }
      )
    }

    // Validate referral code if provided
    let referralResult = null
    if (referralCode) {
      referralResult = await validateReferralCode(referralCode, prisma)
      if (!referralResult.valid) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: referralResult.error },
          { status: 400 }
        )
      }
    }

    // Create application
    const application = await prisma.$transaction(async (tx) => {
      const newApp = await tx.application.create({
        data: {
          jobId,
          candidateId: session.user.id,
          recruiterId: referralResult?.recruiterId || null,
          resumeUrl,
          notes,
        },
        include: {
          job: { include: { company: true } },
          candidate: { select: { id: true, name: true, email: true } },
        },
      })

      // Track referral usage
      if (referralResult?.codeId) {
        await trackReferralUsage(referralResult.codeId, session.user.id, tx as never)
      }

      // Create notification for candidate
      await tx.notification.create({
        data: {
          userId: session.user.id,
          type: 'APPLICATION_SUBMITTED',
          message: `Your application for ${job.title} at ${job.company.name} has been submitted.`,
        },
      })

      return newApp
    })

    // Send confirmation email (non-blocking)
    sendApplicationSubmitted({
      to: session.user.email,
      candidateName: session.user.name,
      jobTitle: job.title,
      companyName: job.company.name,
    }).catch((err) => console.error('Email failed:', err))

    return NextResponse.json<ApiResponse>(
      { success: true, data: application, message: 'Application submitted successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Applications POST error:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
