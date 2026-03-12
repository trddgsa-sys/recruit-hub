'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Filter, X } from 'lucide-react';

interface Filters {
  search: string;
  location: string;
  locationType: string;
  salaryMin: string;
  salaryMax: string;
  experienceLevel: string;
  skills: string;
}

interface JobFiltersProps {
  onFiltersChange: (filters: Partial<Filters>) => void;
}

const locationTypes = [
  { value: '', label: 'All Types' },
  { value: 'REMOTE', label: 'Remote' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'ONSITE', label: 'On-site' },
];

const experienceLevels = [
  { value: '', label: 'All Levels' },
  { value: 'Entry', label: 'Entry Level' },
  { value: 'Mid-Level', label: 'Mid Level' },
  { value: 'Senior', label: 'Senior' },
  { value: 'Lead', label: 'Lead / Principal' },
  { value: 'Director', label: 'Director+' },
];

export function JobFilters({ onFiltersChange }: JobFiltersProps) {
  const [filters, setFilters] = useState<Filters>({
    search: '', location: '', locationType: '',
    salaryMin: '', salaryMax: '', experienceLevel: '', skills: '',
  });

  const update = (key: keyof Filters, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onFiltersChange(next);
  };

  const reset = () => {
    const empty: Filters = { search: '', location: '', locationType: '', salaryMin: '', salaryMax: '', experienceLevel: '', skills: '' };
    setFilters(empty);
    onFiltersChange(empty);
  };

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <Filter className="h-4 w-4" /> Filters
        </div>
        {hasFilters && (
          <button onClick={reset} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600">
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      <Input
        label="Search"
        placeholder="Job title, skills..."
        value={filters.search}
        onChange={(e) => update('search', e.target.value)}
      />

      <Input
        label="Location"
        placeholder="City, country..."
        value={filters.location}
        onChange={(e) => update('location', e.target.value)}
      />

      <Select
        label="Work Type"
        options={locationTypes}
        value={filters.locationType}
        onChange={(e) => update('locationType', e.target.value)}
      />

      <Select
        label="Experience Level"
        options={experienceLevels}
        value={filters.experienceLevel}
        onChange={(e) => update('experienceLevel', e.target.value)}
      />

      <div>
        <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Salary Range</p>
        <div className="flex gap-2">
          <Input
            placeholder="Min ($)"
            type="number"
            value={filters.salaryMin}
            onChange={(e) => update('salaryMin', e.target.value)}
          />
          <Input
            placeholder="Max ($)"
            type="number"
            value={filters.salaryMax}
            onChange={(e) => update('salaryMax', e.target.value)}
          />
        </div>
      </div>

      <Input
        label="Skills"
        placeholder="React, Python, SQL..."
        helperText="Comma-separated"
        value={filters.skills}
        onChange={(e) => update('skills', e.target.value)}
      />
    </div>
  );
}
