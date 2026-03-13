import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { paginationSchema } from '@/lib/validations';
import { apiResponse, apiError } from '@/lib/utils';
import { UserRole, Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  if (![UserRole.ADMIN, UserRole.RECRUITER].includes(session.user.role)) {
    return apiError('Forbidden', 403);
  }

  const { searchParams } = new URL(request.url);
  const { page, limit } = paginationSchema.parse({
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
  });
  const search = searchParams.get('search') ?? '';

  const where: Prisma.UserWhereInput = {
    role: UserRole.CANDIDATE,
    deletedAt: null,
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  // Recruiters see only their referred candidates
  if (session.user.role === UserRole.RECRUITER) {
    const usages = await prisma.referralUsage.findMany({
      where: { code: { recruiterId: session.user.id } },
      select: { candidateId: true },
    });
    where.id = { in: usages.map((u) => u.candidateId) };
  }

  try {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          candidateProfile: {
            select: { phone: true, skills: true, resumeUrl: true, portfolioLinks: true },
          },
          _count: { select: { candidateApps: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    // Shape to match frontend Candidate interface
    const candidates = users.map((u) => ({
      id: u.id,
      phone: u.candidateProfile?.phone ?? null,
      skills: u.candidateProfile?.skills ?? [],
      resumeUrl: u.candidateProfile?.resumeUrl ?? null,
      user: { id: u.id, name: u.name, email: u.email, createdAt: u.createdAt.toISOString() },
      _count: { applications: u._count.candidateApps },
    }));

    return apiResponse(candidates, 200, {
      page, limit, total, totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('[candidates GET]', err);
    return apiError('Internal server error', 500);
  }
}
