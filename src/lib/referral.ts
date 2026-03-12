import { PrismaClient } from '@prisma/client'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export function generateReferralCode(): string {
  let result = 'REC-'
  for (let i = 0; i < 6; i++) {
    result += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return result
}

export async function generateUniqueReferralCode(prisma: PrismaClient): Promise<string> {
  let attempts = 0
  while (attempts < 10) {
    const code = generateReferralCode()
    const existing = await prisma.referralCode.findUnique({ where: { code } })
    if (!existing) return code
    attempts++
  }
  throw new Error('Failed to generate unique referral code after 10 attempts')
}

export interface ReferralValidationResult {
  valid: boolean
  codeId?: string
  recruiterId?: string
  recruiterName?: string
  error?: string
}

export async function validateReferralCode(
  code: string,
  prisma: PrismaClient
): Promise<ReferralValidationResult> {
  const referral = await prisma.referralCode.findUnique({
    where: { code: code.toUpperCase() },
    include: { user: true },
  })

  if (!referral) {
    return { valid: false, error: 'Referral code not found' }
  }

  if (!referral.isActive) {
    return { valid: false, error: 'Referral code is inactive' }
  }

  if (referral.expiresAt && referral.expiresAt < new Date()) {
    return { valid: false, error: 'Referral code has expired' }
  }

  if (referral.usageCount >= referral.usageLimit) {
    return { valid: false, error: 'Referral code has reached its usage limit' }
  }

  return {
    valid: true,
    codeId: referral.id,
    recruiterId: referral.recruiterId,
    recruiterName: referral.user.name,
  }
}

export async function trackReferralUsage(
  codeId: string,
  candidateUserId: string,
  prisma: PrismaClient
): Promise<void> {
  // Check if already tracked
  const existing = await prisma.referralUsage.findUnique({
    where: {
      codeId_candidateId: {
        codeId,
        candidateId: candidateUserId,
      },
    },
  })

  if (existing) return // Already tracked

  await prisma.$transaction([
    prisma.referralUsage.create({
      data: {
        codeId,
        candidateId: candidateUserId,
      },
    }),
    prisma.referralCode.update({
      where: { id: codeId },
      data: { usageCount: { increment: 1 } },
    }),
  ])

  // Update recruiter's total referrals
  const referralCode = await prisma.referralCode.findUnique({
    where: { id: codeId },
    select: { recruiterId: true },
  })

  if (referralCode) {
    await prisma.recruiterProfile.updateMany({
      where: { userId: referralCode.recruiterId },
      data: { totalReferrals: { increment: 1 } },
    })
  }
}
