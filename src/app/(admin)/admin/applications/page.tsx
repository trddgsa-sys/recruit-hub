'use client';
import { useState, useEffect, useCallback } from 'react';
import { StageKanban } from '@/components/features/applications/StageKanban';
import { PageLoader } from '@/components/ui/Spinner';

interface Application {
  id: string;
  stage: string;
  appliedAt: string;
  candidate: { user: { name: string; email: string } };
  job: { title: string; company: { name: string } };
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApps = useCallback(async () => {
    const res = await fetch('/api/applications?limit=100');
    const data = await res.json();
    if (data.success) setApplications(data.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const handleStageChange = async (appId: string, newStage: string) => {
    const res = await fetch(`/api/applications/${appId}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    });
    const data = await res.json();
    if (data.success) {
      setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, stage: newStage } : a)));
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Applications ({applications.length})</h1>
      {applications.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No applications yet.</div>
      ) : (
        <StageKanban applications={applications} onStageChange={handleStageChange} />
      )}
    </div>
  );
}
