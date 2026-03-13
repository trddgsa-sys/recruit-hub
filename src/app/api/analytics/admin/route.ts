import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiResponse, apiError } from '@/lib/utils';
import { UserRole } from '@prisma/client';

export async function GET(_req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const [totalJobs, totalCompanies, totalRecruiters, totalCandidates, totalApplications, hiredCount] =
      await Promise.all([
        prisma.job.count({ where: { deletedAt: null } }),
        prisma.company.count({ where: { deletedAt: null } }),
        prisma.user.count({ where: { role: UserRole.RECRUITER, deletedAt: null } }),
        prisma.user.count({ where: { role: UserRole.CANDIDATE, deletedAt: null } }),
        prisma.application.count(),
        prisma.application.count({ where: { stage: 'HIRED' } }),
      ]);

    const conversionRate = totalApplications > 0
      ? Math.round((hiredCount / totalApplications) * 100)
      : 0;

    // Applications per job (top 10)
    const jobsWithApps = await prisma.job.findMany({
      where: { deletedAt: null },
      select: { title: true, _count: { select: { applications: true } } },
      orderBy: { applications: { _count: 'desc' } },
      take: 10,
    });
    const applicationsPerJob = jobsWithApps.map((j) => ({
      jobTitle: j.title,
      count: j._count.applications,
    }));

    // Pipeline stats
    const stageGroups = await prisma.application.groupBy({
      by: ['stage'],
      _count: { stage: true },
    });
    const pipelineStats = stageGroups.map((s) => ({
      stage: s.stage,
      count: s._count.stage,
    }));

    // Top recruiters
    const topRecruitersRaw = await prisma.recruiterProfile.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { totalReferrals: 'desc' },
      take: 10,
    });
    const topRecruiters = topRecruitersRaw.map((r) => ({
      name: r.user.name,
      referrals: r.totalReferrals,
      hires: r.totalHires,
    }));

    // Hires over time (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const hiredApps = await prisma.application.findMany({
      where: { stage: 'HIRED', appliedAt: { gte: sixMonthsAgo } },
      select: { appliedAt: true },
    });
    const hiresMap = new Map<string, number>();
    hiredApps.forEach((a) => {
      const key = a.appliedAt.toISOString().slice(0, 7);
      hiresMap.set(key, (hiresMap.get(key) ?? 0) + 1);
    });
    const hiresOverTime = Array.from(hiresMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, hires]) => ({ month, hires }));

    return apiResponse({
      totalJobs,
      totalCompanies,
      totalRecruiters,
      totalCandidates,
      totalApplications,
      conversionRate,
      applicationsPerJob,
      pipelineStats,
      topRecruiters,
      hiresOverTime,
    });
  } catch (err) {
    console.error('[analytics/admin GET]', err);
    return apiError('Internal server error', 500);
  }
}
