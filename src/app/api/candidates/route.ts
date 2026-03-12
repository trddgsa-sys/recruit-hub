import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from '@/lib/auth'
import { paginationSchema } from '@/lib/validations'
import { ApiResponse } from '@/types'
import { UserRole } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session || ![UserRole.ADMIN, UserRole.RECRUITER].includes(session.user.role)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    })
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = {
      role: UserRole.CANDIDATE,
      deletedAt: null,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Recruiters can only see their referred candidates
    if (session.user.role === UserRole.RECRUITER) {
      const referralUsages = await prisma.referralUsage.findMany({
        where: {
          code: {
            recruiterId: session.user.id,
          },
        },
        select: { candidateId: true },
      })
      const candidateIds = referralUsages.map((r) => r.candidateId)
      where.id = { in: candidateIds }
    }

    const [candidates, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          candidateProfile: true,
          _count: {
            select: { candidateApps: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ])

    // Transform for frontend
    const items = candidates.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      createdAt: c.createdAt,
      candidateProfile: c.candidateProfile,
      _count: { applications: c._count.candidateApps },
    }))

    return NextResponse.json({
      success: true,
      data: {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Candidates GET error:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
