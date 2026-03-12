'use client';
import { useState } from 'react';
import { StageBadge } from './StageBadge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

const ALL_STAGES = [
  'APPLIED', 'UNDER_REVIEW', 'SHORTLISTED',
  'INTERVIEW_SCHEDULED', 'OFFER_SENT', 'HIRED', 'REJECTED'
];

interface Application {
  id: string;
  stage: string;
  candidate: { user: { name: string; email: string } };
  job: { title: string; company: { name: string } };
  appliedAt: string;
}

interface StageKanbanProps {
  applications: Application[];
  onStageChange: (applicationId: string, newStage: string) => Promise<void>;
}

export function StageKanban({ applications, onStageChange }: StageKanbanProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleChange = async (appId: string, stage: string) => {
    setUpdatingId(appId);
    try {
      await onStageChange(appId, stage);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4 min-w-max pb-4">
        {ALL_STAGES.map((stage) => {
          const stageApps = applications.filter((a) => a.stage === stage);
          return (
            <div key={stage} className="w-64 flex-shrink-0">
              <div className="mb-2 flex items-center justify-between">
                <StageBadge stage={stage} />
                <span className="text-xs text-gray-500">{stageApps.length}</span>
              </div>
              <div className="space-y-2 rounded-xl bg-gray-50 dark:bg-gray-800 p-3 min-h-[200px]">
                {stageApps.map((app) => (
                  <div
                    key={app.id}
                    className="rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-3 shadow-sm"
                  >
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{app.candidate.user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{app.job.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(app.appliedAt).toLocaleDateString()}</p>
                    <div className="mt-2">
                      <Select
                        options={ALL_STAGES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))}
                        value={app.stage}
                        onChange={(e) => handleChange(app.id, e.target.value)}
                        disabled={updatingId === app.id}
                        className="text-xs py-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
