import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { CreateJobSchema, JobFiltersSchema } from '@/lib/validations';
import { apiResponse, apiError } from '@/lib/utils';
import { JobStatus, Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = JobFiltersSchema.parse(Object.fromEntries(searchParams.entries()));
    const { page, limit, search, location, locationType, salaryMin, salaryMax, experienceLevel, skills, companyId, status } = filters;

    const where: Prisma.JobWhereInput = {
      deletedAt: null,
      status: status ?? { in: [JobStatus.ACTIVE, JobStatus.FEATURED] },
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { shortDescription: { contains: search, mode: 'insensitive' } },
          { skillTags: { hasSome: [search] } },
        ],
      }),
      ...(location && { location: { contains: location, mode: 'insensitive' } }),
      ...(locationType && { locationType }),
      ...(salaryMin && { salaryMin: { gte: salaryMin } }),
      ...(salaryMax && { salaryMax: { lte: salaryMax } }),
      ...(experienceLevel && { experienceLevel: { contains: experienceLevel, mode: 'insensitive' } }),
      ...(skills && { skillTags: { hasSome: skills.split(',').map((s) => s.trim()) } }),
      ...(companyId && { companyId }),
    };

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          company: { select: { id: true, name: true, logo: true, industry: true } },
          _count: { select: { applications: true } },
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    return apiResponse(jobs, 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[jobs GET]', err);
    return apiError('Internal server error', 500);
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = CreateJobSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 400);

    const job = await prisma.job.create({
      data: {
        ...parsed.data,
        deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
      },
      include: { company: true },
    });
    return apiResponse(job, 201);
  } catch (err) {
    console.error('[jobs POST]', err);
    return apiError('Internal server error', 500);
  }
}
