import Link from 'next/link';
import { prisma } from '@/lib/db';
import { JobCard } from '@/components/features/jobs/JobCard';
import { JobStatus } from '@prisma/client';
import { Briefcase, Users, Building2, Key, Search, Shield, TrendingUp } from 'lucide-react';

export const revalidate = 60;

export default async function LandingPage() {
  const [featuredJobs, totalJobs, totalCompanies, totalRecruiters] = await Promise.all([
    prisma.job.findMany({
      where: { status: JobStatus.FEATURED, deletedAt: null },
      include: { company: true },
      take: 6,
    }),
    prisma.job.count({ where: { deletedAt: null, status: { in: [JobStatus.ACTIVE, JobStatus.FEATURED] } } }),
    prisma.company.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { role: 'RECRUITER', deletedAt: null } }),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm mb-6 backdrop-blur-sm">
            <Key className="h-3.5 w-3.5" />
            <span>Exclusive access with a recruiter referral code</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
            Get Hired Through<br/>Trusted Referrals
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-indigo-200 mb-10">
            Connect with top companies through dedicated recruiter relationships.
            Enter your referral code to unlock full job details and apply directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-indigo-700 px-8 py-3.5 font-semibold hover:bg-indigo-50 transition-colors shadow-lg"
            >
              <Search className="h-5 w-5" /> Browse Jobs
            </Link>
            <Link
              href="/unlock"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/40 text-white px-8 py-3.5 font-semibold hover:bg-white/10 transition-colors backdrop-blur-sm"
            >
              <Key className="h-5 w-5" /> Enter Referral Code
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { icon: Briefcase, label: 'Open Positions', value: totalJobs },
              { icon: Building2, label: 'Companies', value: totalCompanies },
              { icon: Users, label: 'Recruiters', value: totalRecruiters },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label}>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value.toLocaleString()}+</div>
                <div className="text-sm text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">How RecruitHub Works</h2>
        <p className="text-center text-gray-500 mb-12">Three simple steps to your next opportunity</p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Key, step: '01', title: 'Get Your Code', desc: 'Receive a referral code from a recruiter who knows your background and target roles.' },
            { icon: Search, step: '02', title: 'Unlock Full Details', desc: 'Enter your code to access complete job descriptions, salary ranges, and requirements.' },
            { icon: TrendingUp, step: '03', title: 'Apply & Track', desc: 'Submit your application and track your progress through every hiring stage in real time.' },
          ].map(({ icon: Icon, step, title, desc }) => (
            <div key={step} className="relative rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8">
              <div className="absolute -top-4 left-6 rounded-xl bg-indigo-600 px-3 py-1 text-sm font-bold text-white">{step}</div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
              <p className="text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Jobs */}
      {featuredJobs.length > 0 && (
        <section className="bg-gray-50 dark:bg-gray-950 py-20">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Featured Positions</h2>
                <p className="text-gray-500 mt-1">Hand-picked roles from top companies</p>
              </div>
              <Link href="/jobs" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                View All Jobs →
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredJobs.map((job) => (
                <JobCard key={job.id} job={{ ...job, isLocked: true }} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 text-center">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-12 text-white">
          <Shield className="mx-auto h-12 w-12 mb-4 opacity-80" />
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-indigo-200 mb-8 max-w-lg mx-auto">
            Register as a candidate or recruiter and connect with opportunities that match your skills.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?role=CANDIDATE" className="rounded-xl bg-white text-indigo-700 px-6 py-3 font-semibold hover:bg-indigo-50 transition-colors">
              Join as Candidate
            </Link>
            <Link href="/register?role=RECRUITER" className="rounded-xl border-2 border-white/40 text-white px-6 py-3 font-semibold hover:bg-white/10 transition-colors">
              Join as Recruiter
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
