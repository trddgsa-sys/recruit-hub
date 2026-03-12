import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, getServerSession } from '@/lib/auth';
import { CreateCompanySchema, PaginationSchema } from '@/lib/validations';
import { apiResponse, apiError } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit } = PaginationSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where: { deletedAt: null },
        include: { _count: { select: { jobs: true } } },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.company.count({ where: { deletedAt: null } }),
    ]);

    return apiResponse(companies, 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[companies GET]', err);
    return apiError('Internal server error', 500);
  }
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = CreateCompanySchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 400);

    const company = await prisma.company.create({ data: parsed.data });
    return apiResponse(company, 201);
  } catch (err) {
    console.error('[companies POST]', err);
    return apiError('Internal server error', 500);
  }
}
