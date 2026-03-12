import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { apiResponse, apiError } from '@/lib/utils';

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: session!.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return apiResponse(notifications);
  } catch (err) {
    return apiError('Internal server error', 500);
  }
}
