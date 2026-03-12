import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { registerSchema } from '@/lib/validations'
import { ApiResponse } from '@/types'
import { UserRole } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = registerSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, password, name, role } = validation.data

    // Check if email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    })

    if (existingUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    const passwordHash = await hash(password, 12)

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          role,
        },
      })

      // Create role-specific profile
      if (role === UserRole.RECRUITER) {
        await tx.recruiterProfile.create({
          data: {
            userId: newUser.id,
          },
        })
      } else if (role === UserRole.CANDIDATE) {
        await tx.candidateProfile.create({
          data: {
            userId: newUser.id,
            skills: [],
            portfolioLinks: [],
          },
        })
      }

      return newUser
    })

    return NextResponse.json<ApiResponse<{ id: string; email: string; name: string; role: string }>>(
      {
        success: true,
        data: { id: user.id, email: user.email, name: user.name, role: user.role },
        message: 'Account created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
