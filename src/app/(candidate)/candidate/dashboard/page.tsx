'use client';
import { useState, useEffect } from 'react';
import { StatsCard } from '@/components/features/analytics/StatsCard';
import { StageBadge } from '@/components/features/applications/StageBadge';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/Spinner';
import { FileText, Star, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default function CandidateDashboard() {
  const [profile, setProfile] = useState<{ _count: { applications: number; savedJobs: number }; user: { name: string } } | null>(null);
  const [applications, setApplications] = useState<Array<{ id: string; stage: string; appliedAt: string; job: { title: string; company: { name: string } } }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/candidates/profile').then((r) => r.json()),
      fetch('/api/applications?limit=5').then((r) => r.json()),
    ]).then(([profileData, appsData]) => {
      if (profileData.success) setProfile(profileData.data);
      if (appsData.success) setApplications(appsData.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <PageLoader />;

  const hired = applications.filter((a) => a.stage === 'HIRED').length;
  const inProgress = applications.filter((a) => !['HIRED', 'REJECTED'].includes(a.stage)).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome back, {profile?.user?.name ?? 'Candidate'}!</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Applications" value={profile?._count?.applications ?? 0} icon={FileText} color="indigo" />
        <StatsCard title="In Progress" value={inProgress} icon={Clock} color="orange" />
        <StatsCard title="Hired" value={hired} icon={CheckCircle} color="green" />
        <StatsCard title="Saved Jobs" value={profile?._count?.savedJobs ?? 0} icon={Star} color="purple" />
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Applications</h2>
            <Link href="/candidate/applications" className="text-sm text-indigo-600 hover:text-indigo-700">View All →</Link>
          </div>
        </CardHeader>
        <CardBody>
          {applications.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No applications yet. <Link href="/jobs" className="text-indigo-600">Browse jobs</Link></p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {applications.slice(0, 5).map((app) => (
                <div key={app.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{app.job.title}</p>
                    <p className="text-xs text-gray-500">{app.job.company.name} · {new Date(app.appliedAt).toLocaleDateString()}</p>
                  </div>
                  <StageBadge stage={app.stage} />
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
