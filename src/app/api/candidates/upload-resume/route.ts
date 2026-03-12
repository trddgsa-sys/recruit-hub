import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { apiResponse, apiError } from '@/lib/utils';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB ?? '10');
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './public/uploads';

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;
  if (session!.user.role !== 'CANDIDATE') return apiError('Forbidden', 403);

  try {
    const formData = await req.formData();
    const file = formData.get('resume') as File | null;

    if (!file) return apiError('No file provided', 400);
    if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
      return apiError('Only PDF and Word documents are accepted', 400);
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return apiError(`File size must be under ${MAX_SIZE_MB}MB`, 400);
    }

    const resumeDir = path.join(process.cwd(), UPLOAD_DIR, 'resumes');
    await mkdir(resumeDir, { recursive: true });

    const ext = file.name.split('.').pop();
    const filename = `${session!.user.id}-${Date.now()}.${ext}`;
    const filepath = path.join(resumeDir, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const resumeUrl = `/uploads/resumes/${filename}`;

    await prisma.candidateProfile.update({
      where: { userId: session!.user.id },
      data: { resumeUrl },
    });

    return apiResponse({ resumeUrl });
  } catch (err) {
    console.error('[upload-resume]', err);
    return apiError('Upload failed', 500);
  }
}
