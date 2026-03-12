import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { apiResponse, apiError } from '@/lib/utils';
import { z } from 'zod';
import { JobStatus } from '@prisma/client';

const StatusSchema = z.object({ status: z.nativeEnum(JobStatus) });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = StatusSchema.safeParse(body);
    if (!parsed.success) return apiError('Invalid status', 400);

    const job = await prisma.job.update({
      where: { id: params.id },
      data: { status: parsed.data.status },
    });
    return apiResponse(job);
  } catch (err) {
    return apiError('Internal server error', 500);
  }
}
