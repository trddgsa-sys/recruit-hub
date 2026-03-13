import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from '@/lib/auth'
import { ApiResponse } from '@/types'
import { UserRole } from '@prisma/client'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session || !([UserRole.RECRUITER, UserRole.ADMIN] as string[]).includes(session.user.role)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const referralCode = await prisma.referralCode.findUnique({
      where: { id: params.id },
      include: {
        usages: {
          include: {
            candidate: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    })

    if (!referralCode) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Referral code not found' },
        { status: 404 }
      )
    }

    // Ensure recruiter can only view their own codes
    if (session.user.role === UserRole.RECRUITER && referralCode.recruiterId !== session.user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const candidateIds = referralCode.usages.map((u) => u.candidateId)

    // Get applications from referred candidates
    const applications = await prisma.application.findMany({
      where: {
        candidateId: { in: candidateIds },
        recruiterId: referralCode.recruiterId,
      },
      include: {
        job: {
          include: { company: { select: { name: true } } },
        },
        candidate: {
          select: { name: true, email: true },
        },
      },
    })

    const stageBreakdown = applications.reduce(
      (acc, app) => {
        acc[app.stage] = (acc[app.stage] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return NextResponse.json({
      success: true,
      data: {
        code: referralCode.code,
        usageLimit: referralCode.usageLimit,
        usageCount: referralCode.usageCount,
        isActive: referralCode.isActive,
        expiresAt: referralCode.expiresAt,
        createdAt: referralCode.createdAt,
        totalCandidates: candidateIds.length,
        totalApplications: applications.length,
        stageBreakdown,
        recentCandidates: referralCode.usages.slice(0, 5).map((u) => ({
          candidateId: u.candidateId,
          usedAt: u.usedAt,
          name: u.candidate.name,
          email: u.candidate.email,
        })),
      },
    })
  } catch (error) {
    console.error('Referral stats GET error:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
