'use client';
import { useState, useEffect } from 'react';
import { StatsCard } from '@/components/features/analytics/StatsCard';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/Spinner';
import { Link2, Users, Briefcase, TrendingUp, CheckCircle } from 'lucide-react';
import { StageBadge } from '@/components/features/applications/StageBadge';

interface Analytics {
  totalCodes: number;
  totalUsages: number;
  totalApplications: number;
  totalHires: number;
  conversionRate: number;
}

export default function RecruiterDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recentApps, setRecentApps] = useState<Array<{
    id: string;
    stage: string;
    appliedAt: string;
    job: { title: string };
    candidate: { user: { name: string } };
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/analytics/recruiter').then((r) => r.json()),
      fetch('/api/applications?limit=5').then((r) => r.json()),
    ]).then(([analyticsData, appsData]) => {
      if (analyticsData.success) setAnalytics(analyticsData.data);
      if (appsData.success) setRecentApps(appsData.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Recruiter Dashboard</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard title="Referral Codes" value={analytics?.totalCodes ?? 0} icon={Link2} color="indigo" />
        <StatsCard title="Code Uses" value={analytics?.totalUsages ?? 0} icon={Users} color="blue" />
        <StatsCard title="Applications" value={analytics?.totalApplications ?? 0} icon={Briefcase} color="orange" />
        <StatsCard title="Hires" value={analytics?.totalHires ?? 0} icon={CheckCircle} color="green" />
        <StatsCard title="Conversion" value={`${analytics?.conversionRate ?? 0}%`} icon={TrendingUp} color="purple" />
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Referred Applications</h2>
        </CardHeader>
        <CardBody>
          {recentApps.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No applications from your referrals yet.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentApps.map((app) => (
                <div key={app.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{app.candidate?.user?.name ?? 'Candidate'}</p>
                    <p className="text-xs text-gray-500">{app.job.title} · {new Date(app.appliedAt).toLocaleDateString()}</p>
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
