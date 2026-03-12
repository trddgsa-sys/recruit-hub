'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';
import { Download, FileSpreadsheet } from 'lucide-react';

interface ReportData {
  totalJobs: number;
  totalCompanies: number;
  totalRecruiters: number;
  totalCandidates: number;
  totalApplications: number;
  conversionRate: number;
  topRecruiters: { name: string; referrals: number; hires: number }[];
  pipelineStats: { stage: string; count: number }[];
}

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/admin')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
        setLoading(false);
      });
  }, []);

  const exportCSV = (filename: string, headers: string[], rows: string[][]) => {
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSummary = () => {
    if (!data) return;
    exportCSV('recruithub-summary.csv',
      ['Metric', 'Value'],
      [
        ['Total Jobs', String(data.totalJobs)],
        ['Total Companies', String(data.totalCompanies)],
        ['Total Recruiters', String(data.totalRecruiters)],
        ['Total Candidates', String(data.totalCandidates)],
        ['Total Applications', String(data.totalApplications)],
        ['Conversion Rate', `${data.conversionRate}%`],
      ]
    );
  };

  const exportPipeline = () => {
    if (!data) return;
    exportCSV('recruithub-pipeline.csv',
      ['Stage', 'Count'],
      data.pipelineStats.map((s) => [s.stage, String(s.count)])
    );
  };

  const exportRecruiters = () => {
    if (!data) return;
    exportCSV('recruithub-recruiters.csv',
      ['Recruiter', 'Referrals', 'Hires'],
      data.topRecruiters.map((r) => [r.name, String(r.referrals), String(r.hires)])
    );
  };

  if (loading) return <PageLoader />;
  if (!data) return <p className="text-red-500">Failed to load data</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports</h1>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card hover className="cursor-pointer" onClick={exportSummary}>
          <CardBody className="text-center py-8">
            <FileSpreadsheet className="mx-auto h-8 w-8 text-indigo-600 mb-3" />
            <p className="font-semibold text-gray-900 dark:text-gray-100">Platform Summary</p>
            <p className="text-xs text-gray-500 mt-1">Jobs, companies, candidates overview</p>
            <Button variant="outline" size="sm" className="mt-4"><Download className="h-3 w-3" /> CSV</Button>
          </CardBody>
        </Card>
        <Card hover className="cursor-pointer" onClick={exportPipeline}>
          <CardBody className="text-center py-8">
            <FileSpreadsheet className="mx-auto h-8 w-8 text-green-600 mb-3" />
            <p className="font-semibold text-gray-900 dark:text-gray-100">Pipeline Report</p>
            <p className="text-xs text-gray-500 mt-1">Application stages breakdown</p>
            <Button variant="outline" size="sm" className="mt-4"><Download className="h-3 w-3" /> CSV</Button>
          </CardBody>
        </Card>
        <Card hover className="cursor-pointer" onClick={exportRecruiters}>
          <CardBody className="text-center py-8">
            <FileSpreadsheet className="mx-auto h-8 w-8 text-purple-600 mb-3" />
            <p className="font-semibold text-gray-900 dark:text-gray-100">Recruiter Performance</p>
            <p className="text-xs text-gray-500 mt-1">Referrals, hires, conversion</p>
            <Button variant="outline" size="sm" className="mt-4"><Download className="h-3 w-3" /> CSV</Button>
          </CardBody>
        </Card>
      </div>

      {/* Summary Table */}
      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900 dark:text-gray-100">Platform Summary</h2></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {[
                ['Total Jobs', data.totalJobs],
                ['Total Companies', data.totalCompanies],
                ['Total Recruiters', data.totalRecruiters],
                ['Total Candidates', data.totalCandidates],
                ['Total Applications', data.totalApplications],
                ['Conversion Rate', `${data.conversionRate}%`],
              ].map(([label, value]) => (
                <tr key={String(label)}>
                  <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">{label}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Referral Conversion */}
      {data.topRecruiters.length > 0 && (
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900 dark:text-gray-100">Referral Conversion</h2></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">Recruiter</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Referrals</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Hires</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.topRecruiters.map((r, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{r.name}</td>
                    <td className="px-4 py-3 text-gray-500">{r.referrals}</td>
                    <td className="px-4 py-3 text-gray-500">{r.hires}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {r.referrals > 0 ? Math.round((r.hires / r.referrals) * 100) : 0}%
                    </td>
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
