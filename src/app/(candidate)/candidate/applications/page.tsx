'use client';
import { useState, useEffect } from 'react';
import { StageBadge } from '@/components/features/applications/StageBadge';
import { Card, CardBody } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface AppItem {
  id: string;
  stage: string;
  appliedAt: string;
  notes: string | null;
  resumeUrl: string | null;
  job: { id: string; title: string; company: { name: string; logo: string | null } };
}

export default function CandidateApplicationsPage() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/applications?page=${page}&limit=10`).then((r) => r.json()).then((data) => {
      if (data.success) { setApps(data.data); setTotalPages(data.meta?.totalPages ?? 1); }
      setLoading(false);
    });
  }, [page]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Applications</h1>
      {apps.length === 0 ? (
        <Card><CardBody className="py-12 text-center"><p className="text-gray-500 mb-4">You haven&apos;t applied to any jobs yet.</p><Link href="/jobs"><Button>Browse Jobs</Button></Link></CardBody></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">Job</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Company</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Applied</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {apps.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{app.job.title}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{app.job.company.name}</td>
                    <td className="px-4 py-3"><StageBadge stage={app.stage} /></td>
                    <td className="px-4 py-3 text-gray-500">{new Date(app.appliedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><Link href={`/jobs/${app.job.id}`} className="text-indigo-600 hover:text-indigo-700"><ExternalLink className="h-4 w-4" /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm text-gray-600 px-4">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
}
