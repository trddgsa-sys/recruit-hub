import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRecruiter } from '@/lib/auth';
import { UpdateStageSchema } from '@/lib/validations';
import { apiResponse, apiError } from '@/lib/utils';
import { sendStageChanged, sendInterviewInvite } from '@/lib/email';
import { ApplicationStage } from '@prisma/client';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireRecruiter();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = UpdateStageSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 400);

    const application = await prisma.application.update({
      where: { id: params.id },
      data: { stage: parsed.data.stage, notes: parsed.data.notes },
      include: {
        job: { include: { company: true } },
        candidate: { include: { user: { select: { name: true, email: true } } } },
      },
    });

    // Notify candidate
    await prisma.notification.create({
      data: {
        userId: application.candidate.user.email
          ? (await prisma.user.findUnique({ where: { email: application.candidate.user.email } }))!.id
          : '',
        type: 'STAGE_CHANGED',
        message: `Your application for ${application.job.title} moved to ${parsed.data.stage.replace(/_/g, ' ')}`,
      },
    });

    // Email
    try {
      if (parsed.data.stage === ApplicationStage.INTERVIEW_SCHEDULED) {
        await sendInterviewInvite({
          to: application.candidate.user.email!,
          candidateName: application.candidate.user.name,
          jobTitle: application.job.title,
          companyName: application.job.company.name,
          interviewDetails: parsed.data.notes,
        });
      } else {
        await sendStageChanged({
          to: application.candidate.user.email!,
          candidateName: application.candidate.user.name,
          jobTitle: application.job.title,
          companyName: application.job.company.name,
          newStage: parsed.data.stage,
        });
      }
    } catch (emailErr) {
      console.warn('[stage PATCH] email failed:', emailErr);
    }

    return apiResponse(application);
  } catch (err) {
    console.error('[stage PATCH]', err);
    return apiError('Internal server error', 500);
  }
}
