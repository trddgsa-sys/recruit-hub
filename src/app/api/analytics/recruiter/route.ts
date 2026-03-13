import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRecruiter } from '@/lib/auth';
import { apiResponse, apiError } from '@/lib/utils';

export async function GET(_req: NextRequest) {
  const { session, error } = await requireRecruiter();
  if (error) return error;

  try {
    const [totalCodes, totalUsages, totalApplications, hiredCount] = await Promise.all([
      prisma.referralCode.count({ where: { recruiterId: session.user.id } }),
      prisma.referralUsage.count({ where: { code: { recruiterId: session.user.id } } }),
      prisma.application.count({ where: { recruiterId: session.user.id } }),
      prisma.application.count({ where: { recruiterId: session.user.id, stage: 'HIRED' } }),
    ]);

    const conversionRate = totalApplications > 0
      ? Math.round((hiredCount / totalApplications) * 100)
      : 0;

    // Applications over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentApps = await prisma.application.findMany({
      where: { recruiterId: session.user.id, appliedAt: { gte: thirtyDaysAgo } },
      select: { appliedAt: true },
    });
    const appMap = new Map<string, number>();
    recentApps.forEach((a) => {
      const key = a.appliedAt.toISOString().slice(0, 10);
      appMap.set(key, (appMap.get(key) ?? 0) + 1);
    });
    const applicationsOverTime = Array.from(appMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    // Code performance
    const codes = await prisma.referralCode.findMany({
      where: { recruiterId: session.user.id },
      include: {
        _count: { select: { usages: true } },
        usages: { select: { candidateId: true } },
      },
    });
    const candidateIds = codes.flatMap((c) => c.usages.map((u) => u.candidateId));
    const appsByCandidates = candidateIds.length > 0
      ? await prisma.application.count({ where: { candidateId: { in: candidateIds }, recruiterId: session.user.id } })
      : 0;

    const codePerformance = codes.map((c) => ({
      code: c.code,
      usages: c._count.usages,
      applications: appsByCandidates,
    }));

    return apiResponse({
      totalCodes,
      totalUsages,
      totalApplications,
      totalHires: hiredCount,
      conversionRate,
      applicationsOverTime,
      codePerformance,
    });
  } catch (err) {
    console.error('[analytics/recruiter GET]', err);
    return apiError('Internal server error', 500);
  }
}
