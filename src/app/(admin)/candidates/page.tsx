'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface Candidate {
  id: string;
  phone: string | null;
  skills: string[];
  resumeUrl: string | null;
  user: { id: string; name: string; email: string; createdAt: string };
  _count: { applications: number };
}

export default function AdminCandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20', ...(search && { search }) });
    fetch(`/api/candidates?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setCandidates(data.data);
          setTotalPages(data.meta?.totalPages ?? 1);
        }
        setLoading(false);
      });
  }, [page, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Candidates</h1>
        <div className="w-64">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {loading ? <PageLoader /> : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">Name</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Email</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Phone</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Skills</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Apps</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Resume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {candidates.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No candidates found.</td></tr>
                ) : (
                  candidates.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{c.user.name}</td>
                      <td className="px-4 py-3 text-gray-500">{c.user.email}</td>
                      <td className="px-4 py-3 text-gray-500">{c.phone ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {c.skills.slice(0, 3).map((s) => <Badge key={s}>{s}</Badge>)}
                          {c.skills.length > 3 && <Badge>+{c.skills.length - 3}</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{c._count.applications}</td>
                      <td className="px-4 py-3">
                        {c.resumeUrl ? (
                          <a href={c.resumeUrl} target="_blank" className="text-indigo-600 hover:underline text-xs">View</a>
                        ) : <span className="text-gray-400 text-xs">None</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600 px-4">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
