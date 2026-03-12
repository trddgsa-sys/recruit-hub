import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from '@/lib/auth'
import { ApiResponse } from '@/types'
import { UserRole } from '@prisma/client'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const [
      totalUsers,
      totalCandidates,
      totalRecruiters,
      totalCompanies,
      totalJobs,
      activeJobs,
      totalApplications,
      hiredCount,
      applicationsByStageRaw,
      recentApplications,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { role: UserRole.CANDIDATE, deletedAt: null } }),
      prisma.user.count({ where: { role: UserRole.RECRUITER, deletedAt: null } }),
      prisma.company.count(),
      prisma.job.count(),
      prisma.job.count({ where: { status: { in: ['ACTIVE', 'FEATURED'] } } }),
      prisma.application.count(),
      prisma.application.count({ where: { stage: 'HIRED' } }),
      prisma.application.groupBy({
        by: ['stage'],
        _count: { stage: true },
      }),
      prisma.application.findMany({
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

    const monthlyApplicationsRaw = await prisma.application.findMany({
      where: { appliedAt: { gte: sixMonthsAgo } },
      select: { appliedAt: true },
    })

    const monthlyMap = new Map<string, number>()
    monthlyApplicationsRaw.forEach((app) => {
      const key = app.appliedAt.toISOString().slice(0, 7) // YYYY-MM
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1)
    })

    const monthlyApplications = Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }))

    // Top companies by jobs
    const topCompaniesRaw = await prisma.company.findMany({
      include: {
        _count: { select: { jobs: true } },
        jobs: {
          include: {
            _count: { select: { applications: true } },
          },
        },
      },
      orderBy: { jobs: { _count: 'desc' } },
      take: 5,
    })

    const topCompanies = topCompaniesRaw.map((company) => ({
      name: company.name,
      jobCount: company._count.jobs,
      applicationCount: company.jobs.reduce((sum, job) => sum + job._count.applications, 0),
    }))

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalCandidates,
        totalRecruiters,
        totalCompanies,
        totalJobs,
        activeJobs,
        totalApplications,
        hiredCount,
        applicationsByStage,
        monthlyApplications,
        topCompanies,
        recentApplications,
      },
    })
  } catch (error) {
    console.error('Admin analytics GET error:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
