import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { createApplicationSchema, paginationSchema } from '@/lib/validations';
import { validateReferralCode, trackReferralUsage } from '@/lib/referral';
import { sendApplicationSubmitted } from '@/lib/email';
import { apiResponse, apiError } from '@/lib/utils';
import { ApplicationStage, UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const { page, limit } = paginationSchema.parse({
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
  });
  const stage = searchParams.get('stage') as ApplicationStage | null;

  const where: Record<string, unknown> = {};

  if (session.user.role === UserRole.CANDIDATE) {
    where.candidateId = session.user.id;
  } else if (session.user.role === UserRole.RECRUITER) {
    where.recruiterId = session.user.id;
  }

  if (stage) where.stage = stage;

  try {
    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          job: { include: { company: { select: { id: true, name: true, logo: true } } } },
          candidate: { select: { id: true, name: true, email: true } },
          recruiter: { select: { id: true, name: true, email: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { appliedAt: 'desc' },
      }),
      prisma.application.count({ where }),
    ]);

    return apiResponse(applications, 200, {
      page, limit, total, totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('[applications GET]', err);
    return apiError('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  if (session.user.role !== UserRole.CANDIDATE) {
    return apiError('Only candidates can apply for jobs', 403);
  }

  try {
    const body = await request.json();
    const validation = createApplicationSchema.safeParse(body);
    if (!validation.success) return apiError(validation.error.errors[0].message, 400);

    const { jobId, referralCode, resumeUrl, notes } = validation.data;

    const job = await prisma.job.findFirst({
      where: { id: jobId, deletedAt: null },
      include: { company: true },
    });

    if (!job || !['ACTIVE', 'FEATURED'].includes(job.status)) {
      return apiError('Job not found or not accepting applications', 404);
    }

    const existingApp = await prisma.application.findUnique({
      where: { jobId_candidateId: { jobId, candidateId: session.user.id } },
    });
    if (existingApp) return apiError('You have already applied for this job', 409);

    let referralResult = null;
    if (referralCode) {
      referralResult = await validateReferralCode(referralCode, prisma);
      if (!referralResult.valid) return apiError(referralResult.error ?? 'Invalid code', 400);
    }

    const application = await prisma.application.create({
      data: {
        jobId,
        candidateId: session.user.id,
        recruiterId: referralResult?.recruiterId ?? null,
        resumeUrl: resumeUrl ?? null,
        notes: notes ?? null,
      },
      include: {
        job: { include: { company: true } },
        candidate: { select: { id: true, name: true, email: true } },
      },
    });

    // Track referral usage and create notification (non-critical, non-blocking errors)
    const postCreate: Promise<unknown>[] = [
      prisma.notification.create({
        data: {
          userId: session.user.id,
          type: 'APPLICATION_SUBMITTED',
          message: `Your application for ${job.title} at ${job.company.name} has been submitted.`,
        },
      }),
    ];

    if (referralResult?.codeId) {
      postCreate.push(trackReferralUsage(referralResult.codeId, session.user.id, prisma));
    }

    await Promise.allSettled(postCreate);

    sendApplicationSubmitted({
      to: session.user.email,
      candidateName: session.user.name,
      jobTitle: job.title,
      companyName: job.company.name,
    }).catch((err) => console.error('Email failed:', err));

    return apiResponse(application, 201);
  } catch (err) {
    console.error('[applications POST]', err);
    return apiError('Internal server error', 500);
  }
}
