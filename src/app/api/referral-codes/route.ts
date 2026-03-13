import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRecruiter } from '@/lib/auth';
import { generateReferralCodeSchema } from '@/lib/validations';
import { generateUniqueReferralCode } from '@/lib/referral';
import { apiResponse, apiError } from '@/lib/utils';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  const { session, error } = await requireRecruiter();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const recruiterId = session.user.role === UserRole.ADMIN
    ? (searchParams.get('recruiterId') ?? session.user.id)
    : session.user.id;

  try {
    const codes = await prisma.referralCode.findMany({
      where: { recruiterId },
      include: { _count: { select: { usages: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return apiResponse(codes);
  } catch (err) {
    console.error('[referral-codes GET]', err);
    return apiError('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireRecruiter();
  if (error) return error;

  try {
    const body = await request.json();
    const validation = generateReferralCodeSchema.safeParse(body);
    if (!validation.success) return apiError(validation.error.errors[0].message, 400);

    const code = await generateUniqueReferralCode(prisma);
    const referralCode = await prisma.referralCode.create({
      data: {
        code,
        recruiterId: session.user.id,
        usageLimit: validation.data.usageLimit,
        expiresAt: validation.data.expiresAt ? new Date(validation.data.expiresAt) : null,
      },
    });

    return apiResponse(referralCode, 201);
  } catch (err) {
    console.error('[referral-codes POST]', err);
    return apiError('Internal server error', 500);
  }
}
