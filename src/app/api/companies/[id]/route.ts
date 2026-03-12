import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { UpdateCompanySchema } from '@/lib/validations';
import { apiResponse, apiError } from '@/lib/utils';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const company = await prisma.company.findFirst({
      where: { id: params.id, deletedAt: null },
      include: { _count: { select: { jobs: true } } },
    });
    if (!company) return apiError('Company not found', 404);
    return apiResponse(company);
  } catch (err) {
    return apiError('Internal server error', 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = UpdateCompanySchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 400);

    const company = await prisma.company.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return apiResponse(company);
  } catch (err) {
    return apiError('Internal server error', 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await prisma.company.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });
    return apiResponse({ deleted: true });
  } catch (err) {
    return apiError('Internal server error', 500);
  }
}
