import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { CandidateProfileSchema } from '@/lib/validations';
import { apiResponse, apiError } from '@/lib/utils';

export async function GET(_req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: session!.user.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { applications: true, savedJobs: true } },
      },
    });
    if (!profile) return apiError('Profile not found', 404);
    return apiResponse(profile);
  } catch (err) {
    return apiError('Internal server error', 500);
  }
}

export async function PUT(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;
  if (session!.user.role !== 'CANDIDATE') return apiError('Forbidden', 403);

  try {
    const body = await req.json();
    const parsed = CandidateProfileSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 400);

    const { name, ...profileData } = parsed.data;

    // Update user name if provided
    if (name) {
      await prisma.user.update({ where: { id: session!.user.id }, data: { name } });
    }

    const profile = await prisma.candidateProfile.update({
      where: { userId: session!.user.id },
      data: profileData,
    });

    return apiResponse(profile);
  } catch (err) {
    return apiError('Internal server error', 500);
  }
}
