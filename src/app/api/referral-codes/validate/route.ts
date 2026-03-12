import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from '@/lib/auth'
import { validateReferralCodeSchema } from '@/lib/validations'
import { validateReferralCode, trackReferralUsage } from '@/lib/referral'
import { ApiResponse } from '@/types'
import { UserRole } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = validateReferralCodeSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const result = await validateReferralCode(validation.data.code, prisma)

    if (!result.valid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    // If user is authenticated as a candidate, track the usage
    const session = await getServerSession()
    if (session && session.user.role === UserRole.CANDIDATE && result.codeId) {
      try {
        await trackReferralUsage(result.codeId, session.user.id, prisma)
      } catch (err) {
        // Silent fail if already tracked
        console.log('Referral tracking:', err)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        code: validation.data.code.toUpperCase(),
        recruiterId: result.recruiterId,
        recruiterName: result.recruiterName,
      },
      message: 'Referral code validated successfully',
    })
  } catch (error) {
    console.error('Referral validate error:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
