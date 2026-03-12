'use client';
import { useState, useEffect } from 'react';
import { StatsCard } from '@/components/features/analytics/StatsCard';
import { ApplicationsBarChart, PipelinePieChart, HiresLineChart } from '@/components/features/analytics/RecruitmentCharts';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/Spinner';
import { Briefcase, Building2, Users, FileText, UserCheck, TrendingUp } from 'lucide-react';

interface Analytics {
  totalJobs: number;
  totalCompanies: number;
  totalRecruiters: number;
  totalCandidates: number;
  totalApplications: number;
  conversionRate: number;
  applicationsPerJob: { jobTitle: string; count: number }[];
  pipelineStats: { stage: string; count: number }[];
  topRecruiters: { name: string; referrals: number; hires: number }[];
  hiresOverTime: { month: string; hires: number }[];
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/admin')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setAnalytics(data.data);
        setLoading(false);
      });
  }, []);

  if (loading) return <PageLoader />;
  if (!analytics) return <p className="text-red-500">Failed to load analytics</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard title="Jobs" value={analytics.totalJobs} icon={Briefcase} color="indigo" />
        <StatsCard title="Companies" value={analytics.totalCompanies} icon={Building2} color="blue" />
        <StatsCard title="Recruiters" value={analytics.totalRecruiters} icon={UserCheck} color="purple" />
        <StatsCard title="Candidates" value={analytics.totalCandidates} icon={Users} color="green" />
        <StatsCard title="Applications" value={analytics.totalApplications} icon={FileText} color="orange" />
        <StatsCard title="Conversion" value={`${analytics.conversionRate}%`} icon={TrendingUp} color="red" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900 dark:text-gray-100">Applications Per Job</h2></CardHeader>
          <CardBody><ApplicationsBarChart data={analytics.applicationsPerJob} /></CardBody>
        </Card>
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900 dark:text-gray-100">Pipeline Distribution</h2></CardHeader>
          <CardBody><PipelinePieChart data={analytics.pipelineStats} /></CardBody>
        </Card>
      </div>
      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900 dark:text-gray-100">Hires Over Time</h2></CardHeader>
        <CardBody><HiresLineChart data={analytics.hiresOverTime} /></CardBody>
      </Card>
      {analytics.topRecruiters.length > 0 && (
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900 dark:text-gray-100">Top Recruiters</h2></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">Recruiter</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Referrals</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Hires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {analytics.topRecruiters.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{r.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{r.referrals}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{r.hires}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
