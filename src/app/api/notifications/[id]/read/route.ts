import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { apiResponse, apiError } from '@/lib/utils';

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const notification = await prisma.notification.updateMany({
      where: { id: params.id, userId: session!.user.id },
      data: { isRead: true },
    });
    return apiResponse({ updated: notification.count });
  } catch (err) {
    return apiError('Internal server error', 500);
  }
}
