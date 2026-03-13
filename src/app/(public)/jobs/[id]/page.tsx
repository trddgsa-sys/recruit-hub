import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getServerSession } from '@/lib/auth';
import { formatSalary } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { MapPin, Briefcase, DollarSign, Clock, Building2, Lock } from 'lucide-react';
import { JobApplySection } from './JobApplySection';

interface PageProps { params: { id: string } }

export default async function JobDetailPage({ params }: PageProps) {
  const job = await prisma.job.findFirst({
    where: { id: params.id, deletedAt: null },
    include: { company: true },
  });
  if (!job) notFound();

  const session = await getServerSession();
  let isUnlocked = false;

  if (session?.user?.role === 'ADMIN' || session?.user?.role === 'RECRUITER') {
    isUnlocked = true;
  } else if (session?.user?.role === 'CANDIDATE') {
    const usage = await prisma.referralUsage.findFirst({ where: { candidateId: session.user.id } });
    isUnlocked = !!usage;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
            <Building2 className="h-8 w-8" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{job.title}</h1>
              {job.status === 'FEATURED' && <Badge variant="purple">Featured</Badge>}
            </div>
            <p className="text-lg text-indigo-600 font-medium">{job.company.name}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{job.location}</span>
              <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" />{job.locationType}</span>
              {job.deadline && (
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />
                  Deadline: {new Date(job.deadline).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {job.skillTags.map((tag) => (
            <span key={tag} className="rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-1 text-sm text-gray-600 dark:text-gray-400">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Overview */}
      <div className="mt-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Overview</h2>
        <p className="text-gray-600 dark:text-gray-400">{job.shortDescription}</p>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Experience</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">{job.experienceLevel}</p>
          </div>
          {(job.salaryMin || job.salaryMax) && isUnlocked && (
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Salary</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{formatSalary(job.salaryMin, job.salaryMax)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Full Details or Lock Gate */}
      {isUnlocked ? (
        <>
          <div className="mt-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Full Description</h2>
              <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {job.fullDescription}
              </div>
            </section>
            <hr className="border-gray-200 dark:border-gray-700" />
            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Responsibilities</h2>
              <div className="whitespace-pre-wrap text-gray-600 dark:text-gray-400">{job.responsibilities}</div>
            </section>
            <hr className="border-gray-200 dark:border-gray-700" />
            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Requirements</h2>
              <div className="whitespace-pre-wrap text-gray-600 dark:text-gray-400">{job.requirements}</div>
            </section>
          </div>
          <JobApplySection jobId={job.id} jobTitle={job.title} session={session} />
        </>
      ) : (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
            <Lock className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Full Details Locked
          </h3>
          <p className="text-gray-500 mb-6">
            Enter a recruiter referral code to unlock the full job description, salary range, and apply.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/unlock"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Enter Referral Code
            </Link>
            {!session && (
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 px-6 py-3 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Create Account
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
