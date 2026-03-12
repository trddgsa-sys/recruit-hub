'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';
import { Plus, Pencil, Trash2, Pause, Play, Star } from 'lucide-react';
import Link from 'next/link';

interface JobItem {
  id: string;
  title: string;
  status: string;
  locationType: string;
  experienceLevel: string;
  company: { name: string };
  _count: { applications: number };
  createdAt: string;
}

const statusBadge: Record<string, 'success' | 'warning' | 'danger' | 'purple'> = {
  ACTIVE: 'success', PAUSED: 'warning', CLOSED: 'danger', FEATURED: 'purple',
};

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    const res = await fetch('/api/jobs?limit=100&status=ACTIVE');
    const allRes = await fetch('/api/jobs?limit=100');
    const data = await allRes.json();
    if (data.success) setJobs(data.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'PAUSED' ? 'ACTIVE' : 'PAUSED';
    await fetch(`/api/jobs/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchJobs();
  };

  const toggleFeatured = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'FEATURED' ? 'ACTIVE' : 'FEATURED';
    await fetch(`/api/jobs/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchJobs();
  };

  const deleteJob = async (id: string) => {
    if (!confirm('Delete this job?')) return;
    await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
    fetchJobs();
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Jobs ({jobs.length})</h1>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">Title</th>
                <th className="px-4 py-3 font-medium text-gray-500">Company</th>
                <th className="px-4 py-3 font-medium text-gray-500">Type</th>
                <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500">Apps</th>
                <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="px-4 py-3">
                    <Link href={`/jobs/${job.id}`} className="font-medium text-gray-900 dark:text-gray-100 hover:text-indigo-600">{job.title}</Link>
                    <p className="text-xs text-gray-400">{job.experienceLevel}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{job.company.name}</td>
                  <td className="px-4 py-3"><Badge>{job.locationType}</Badge></td>
                  <td className="px-4 py-3"><Badge variant={statusBadge[job.status] ?? 'default'}>{job.status}</Badge></td>
                  <td className="px-4 py-3 text-gray-500">{job._count.applications}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => toggleStatus(job.id, job.status)} className="p-1.5 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20" title={job.status === 'PAUSED' ? 'Resume' : 'Pause'}>
                        {job.status === 'PAUSED' ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                      </button>
                      <button onClick={() => toggleFeatured(job.id, job.status)} className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20" title="Toggle featured">
                        <Star className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteJob(job.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
