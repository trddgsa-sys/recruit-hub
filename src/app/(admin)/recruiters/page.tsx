'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';

interface Recruiter {
  id: string;
  user: { name: string; email: string; createdAt: string };
  totalReferrals: number;
  totalHires: number;
  referralCodes: { code: string; usageCount: number; isActive: boolean }[];
}

export default function AdminRecruitersPage() {
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/candidates?limit=100') // Reuse candidates endpoint for admin
      .then(() => {
        // Fetch recruiters directly — in a real app this would be a dedicated endpoint
        // For now, use a simplified fetch
        return fetch('/api/companies?limit=1'); // trigger auth check
      })
      .then(async () => {
        // Simplified: fetch from the analytics which has top recruiters
        const res = await fetch('/api/analytics/admin');
        const data = await res.json();
        if (data.success && data.data.topRecruiters) {
          setRecruiters(data.data.topRecruiters.map((r: { name: string; referrals: number; hires: number }, i: number) => ({
            id: String(i),
            user: { name: r.name, email: '', createdAt: '' },
            totalReferrals: r.referrals,
            totalHires: r.hires,
            referralCodes: [],
          })));
        }
        setLoading(false);
      });
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Recruiters</h1>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="px-4 py-3 font-medium text-gray-500">Referrals</th>
                <th className="px-4 py-3 font-medium text-gray-500">Hires</th>
                <th className="px-4 py-3 font-medium text-gray-500">Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {recruiters.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No recruiters found.</td></tr>
              ) : (
                recruiters.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{r.user.name}</td>
                    <td className="px-4 py-3 text-gray-500">{r.totalReferrals}</td>
                    <td className="px-4 py-3 text-gray-500">{r.totalHires}</td>
                    <td className="px-4 py-3">
                      <Badge variant={r.totalReferrals > 0 && r.totalHires > 0 ? 'success' : 'default'}>
                        {r.totalReferrals > 0 ? Math.round((r.totalHires / r.totalReferrals) * 100) : 0}%
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
