'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/Spinner';
import { StatsCard } from '@/components/features/analytics/StatsCard';
import { ApplicationsLineChart } from '@/components/features/analytics/RecruitmentCharts';
import { Link2, Users, Briefcase, CheckCircle, TrendingUp } from 'lucide-react';

interface RecAnalytics {
  totalCodes: number;
  totalUsages: number;
  totalApplications: number;
  totalHires: number;
  conversionRate: number;
  applicationsOverTime: { date: string; count: number }[];
  codePerformance: { code: string; usages: number; applications: number }[];
}

export default function RecruiterAnalyticsPage() {
  const [data, setData] = useState<RecAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/recruiter')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
        setLoading(false);
      });
  }, []);

  if (loading) return <PageLoader />;
  if (!data) return <p className="text-red-500">Failed to load analytics</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard title="Referral Codes" value={data.totalCodes} icon={Link2} color="indigo" />
        <StatsCard title="Code Uses" value={data.totalUsages} icon={Users} color="blue" />
        <StatsCard title="Applications" value={data.totalApplications} icon={Briefcase} color="orange" />
        <StatsCard title="Hires" value={data.totalHires} icon={CheckCircle} color="green" />
        <StatsCard title="Conversion" value={`${data.conversionRate}%`} icon={TrendingUp} color="purple" />
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Applications Over Time</h2>
        </CardHeader>
        <CardBody>
          <ApplicationsLineChart data={data.applicationsOverTime} />
        </CardBody>
      </Card>

      {data.codePerformance.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Code Performance</h2>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">Code</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Uses</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Applications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.codePerformance.map((cp) => (
                  <tr key={cp.code} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-4 py-3 font-mono text-indigo-600 font-semibold">{cp.code}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{cp.usages}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{cp.applications}</td>
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
