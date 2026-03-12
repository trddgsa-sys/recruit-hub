'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/Spinner';
import { StageBadge } from '@/components/features/applications/StageBadge';
import { Users } from 'lucide-react';

interface ReferredCandidate {
  id: string;
  stage: string;
  appliedAt: string;
  job: { title: string; company: { name: string } };
  candidate: { user: { name: string; email: string }; skills: string[] };
}

export default function RecruiterCandidatesPage() {
  const [apps, setApps] = useState<ReferredCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/applications?limit=50')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setApps(data.data);
        setLoading(false);
      });
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Referred Candidates</h1>

      {apps.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500">No candidates have applied using your referral codes yet.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">Candidate</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Email</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Job</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Stage</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {apps.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {app.candidate?.user?.name ?? 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{app.candidate?.user?.email ?? 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      <div>{app.job.title}</div>
                      <div className="text-xs text-gray-400">{app.job.company?.name}</div>
                    </td>
                    <td className="px-4 py-3"><StageBadge stage={app.stage} /></td>
                    <td className="px-4 py-3 text-gray-500">{new Date(app.appliedAt).toLocaleDateString()}</td>
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
