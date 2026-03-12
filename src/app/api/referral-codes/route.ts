import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from '@/lib/auth'
import { generateReferralCodeSchema } from '@/lib/validations'
import { generateUniqueReferralCode } from '@/lib/referral'
import { ApiResponse } from '@/types'
import { UserRole } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session || ![UserRole.RECRUITER, UserRole.ADMIN].includes(session.user.role)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const recruiterId = session.user.role === UserRole.ADMIN
      ? (searchParams.get('recruiterId') || session.user.id)
      : session.user.id

    const codes = await prisma.referralCode.findMany({
      where: { recruiterId },
      include: {
        _count: {
          select: { usages: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: codes })
  } catch (error) {
    console.error('Referral codes GET error:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session || ![UserRole.RECRUITER, UserRole.ADMIN].includes(session.user.role)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = generateReferralCodeSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    // Generate unique code
    const code = await generateUniqueReferralCode(prisma)

    const referralCode = await prisma.referralCode.create({
      data: {
        code,
        recruiterId: session.user.id,
        usageLimit: validation.data.usageLimit,
        expiresAt: validation.data.expiresAt ? new Date(validation.data.expiresAt) : null,
      },
    })

    return NextResponse.json<ApiResponse>(
      { success: true, data: referralCode, message: 'Referral code generated successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Referral codes POST error:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
