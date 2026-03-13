import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, getServerSession } from '@/lib/auth';
import { UpdateJobSchema } from '@/lib/validations';
import { apiResponse, apiError } from '@/lib/utils';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const job = await prisma.job.findFirst({
      where: { id: params.id, deletedAt: null },
      include: { company: true, _count: { select: { applications: true } } },
    });
    if (!job) return apiError('Job not found', 404);

    // Check if candidate has unlocked this job via a valid referral code
    const session = await getServerSession();
    let isUnlocked = false;

    if (session?.user?.role === 'ADMIN' || session?.user?.role === 'RECRUITER') {
      isUnlocked = true;
    } else if (session?.user?.role === 'CANDIDATE') {
      const usage = await prisma.referralUsage.findFirst({
        where: { candidateId: session.user.id },
      });
      isUnlocked = !!usage;
    }

    // Return preview only if not unlocked
    if (!isUnlocked) {
      const { fullDescription, requirements, responsibilities, salaryMin, salaryMax, ...preview } = job;
      return apiResponse({ ...preview, isLocked: true });
    }

    return apiResponse({ ...job, isLocked: false });
  } catch (err) {
    console.error('[job GET]', err);
    return apiError('Internal server error', 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = UpdateJobSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 400);

    const job = await prisma.job.update({
      where: { id: params.id },
      data: {
        ...parsed.data,
        deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : undefined,
      },
      include: { company: true },
    });
    return apiResponse(job);
  } catch (err) {
    return apiError('Internal server error', 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await prisma.job.update({ where: { id: params.id }, data: { deletedAt: new Date() } });
    return apiResponse({ deleted: true });
  } catch (err) {
    return apiError('Internal server error', 500);
  }
}
