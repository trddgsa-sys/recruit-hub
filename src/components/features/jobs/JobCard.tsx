import React from 'react';
import Link from 'next/link';
import { MapPin, Clock, DollarSign, Lock, Unlock, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatSalary } from '@/lib/utils';

interface JobCardProps {
  job: {
    id: string;
    title: string;
    location: string;
    locationType: string;
    salaryMin?: number | null;
    salaryMax?: number | null;
    shortDescription: string;
    skillTags: string[];
    status: string;
    isLocked?: boolean;
    deadline?: string | null;
    company: { name: string; logo?: string | null; industry?: string | null };
    _count?: { applications: number };
  };
}

const locationColor: Record<string, 'success' | 'info' | 'default'> = {
  REMOTE: 'success',
  HYBRID: 'info',
  ONSITE: 'default',
};

export function JobCard({ job }: JobCardProps) {
  return (
    <Link href={`/jobs/${job.id}`}>
      <div className="group rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm transition-all hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 transition-colors">
                {job.title}
              </h3>
              <p className="text-sm text-gray-500">{job.company.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {job.status === 'FEATURED' && <Badge variant="purple">Featured</Badge>}
            <Badge variant={locationColor[job.locationType] ?? 'default'}>{job.locationType}</Badge>
            {job.isLocked !== false ? (
              <Lock className="h-4 w-4 text-gray-400" aria-label="Locked" />
            ) : (
              <Unlock className="h-4 w-4 text-green-500" aria-label="Unlocked" />
            )}
          </div>
        </div>

        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{job.shortDescription}</p>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
          {(job.salaryMin || job.salaryMax) && (
            <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />{formatSalary(job.salaryMin, job.salaryMax)}</span>
          )}
          {job.deadline && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Deadline: {new Date(job.deadline).toLocaleDateString()}
            </span>
          )}
        </div>

        {job.skillTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.skillTags.slice(0, 5).map((tag) => (
              <span key={tag} className="rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-400">
                {tag}
              </span>
            ))}
            {job.skillTags.length > 5 && (
              <span className="rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-500">
                +{job.skillTags.length - 5}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
