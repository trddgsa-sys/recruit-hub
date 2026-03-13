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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            _count: { select: { candidateApps: true, savedJobs: true } },
          },
        },
      },
    });
    if (!profile) return apiError('Profile not found', 404);

    // Flatten _count to top-level for frontend compatibility
    return apiResponse({
      ...profile,
      _count: {
        applications: profile.user._count.candidateApps,
        savedJobs: profile.user._count.savedJobs,
      },
    });
  } catch (err) {
    console.error('[candidates/profile GET]', err);
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

    const { name, ...profileData } = parsed.data as typeof parsed.data & { name?: string };

    if (name) {
      await prisma.user.update({ where: { id: session!.user.id }, data: { name } });
    }

    const profile = await prisma.candidateProfile.upsert({
      where: { userId: session!.user.id },
      update: profileData,
      create: { userId: session!.user.id, ...profileData },
    });

    return apiResponse(profile);
  } catch (err) {
    console.error('[candidates/profile PUT]', err);
    return apiError('Internal server error', 500);
  }
}
