import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { apiResponse, apiError } from '@/lib/utils';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        job: { include: { company: true } },
        candidate: { select: { id: true, name: true, email: true, candidateProfile: true } },
        recruiter: { select: { id: true, name: true, email: true } },
      },
    });

    if (!application) return apiError('Application not found', 404);

    // Access control: candidate can only see their own
    const role = session!.user.role;
    if (role === 'CANDIDATE' && application.candidateId !== session!.user.id) {
      return apiError('Forbidden', 403);
    }

    return apiResponse(application);
  } catch (err) {
    return apiError('Internal server error', 500);
  }
}
