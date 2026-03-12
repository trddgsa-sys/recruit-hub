import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from '@/lib/auth'
import { ApiResponse } from '@/types'
import { UserRole } from '@prisma/client'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session || session.user.role !== UserRole.RECRUITER) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const [
      recruiterProfile,
      totalCodes,
      activeCodes,
      totalApplications,
      applicationsByStageRaw,
      recentApplications,
    ] = await Promise.all([
      prisma.recruiterProfile.findUnique({
        where: { userId: session.user.id },
      }),
      prisma.referralCode.count({
        where: { recruiterId: session.user.id },
      }),
      prisma.referralCode.count({
        where: {
          recruiterId: session.user.id,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      }),
      prisma.application.count({
        where: { recruiterId: session.user.id },
      }),
      prisma.application.groupBy({
        by: ['stage'],
        where: { recruiterId: session.user.id },
        _count: { stage: true },
      }),
      prisma.application.findMany({
        where: { recruiterId: session.user.id },
        take: 10,
        orderBy: { appliedAt: 'desc' },
        include: {
          job: { include: { company: { select: { name: true } } } },
          candidate: { select: { name: true, email: true } },
        },
      }),
    ])

    const applicationsByStage = applicationsByStageRaw.reduce(
      (acc, item) => {
        acc[item.stage] = item._count.stage
        return acc
      },
      {} as Record<string, number>
    )

    // Monthly applications for the last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyRaw = await prisma.application.findMany({
      where: {
        recruiterId: session.user.id,
        appliedAt: { gte: sixMonthsAgo },
      },
      select: { appliedAt: true, stage: true },
    })

    const monthlyMap = new Map<string, number>()
    monthlyRaw.forEach((app) => {
      const key = app.appliedAt.toISOString().slice(0, 7)
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1)
    })

    const monthlyApplications = Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }))

    return NextResponse.json({
      success: true,
      data: {
        totalReferrals: recruiterProfile?.totalReferrals || 0,
        totalHires: recruiterProfile?.totalHires || 0,
        activeCodes,
        totalCodes,
        totalApplications,
        applicationsByStage,
        monthlyApplications,
        recentApplications,
      },
    })
  } catch (error) {
    console.error('Recruiter analytics GET error:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
