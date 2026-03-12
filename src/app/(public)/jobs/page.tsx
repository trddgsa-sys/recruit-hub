'use client';
import { useState, useEffect, useCallback } from 'react';
import { JobCard } from '@/components/features/jobs/JobCard';
import { JobFilters } from '@/components/features/jobs/JobFilters';
import { PageLoader } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  location: string;
  locationType: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  shortDescription: string;
  skillTags: string[];
  status: string;
  deadline?: string | null;
  company: { name: string; logo?: string | null; industry?: string | null };
  _count?: { applications: number };
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const fetchJobs = useCallback(async (p: number, f: Record<string, string>) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '12', ...f });
      const res = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      if (data.success) {
        setJobs(data.data);
        setTotalPages(data.meta?.totalPages ?? 1);
        setTotal(data.meta?.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(page, filters); }, [page, filters, fetchJobs]);

  const handleFiltersChange = (f: Record<string, string>) => {
    // Remove empty values
    const clean = Object.fromEntries(Object.entries(f).filter(([, v]) => v));
    setFilters(clean);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Job Listings</h1>
        <p className="text-gray-500 mt-1">{total} positions available</p>
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <aside className="hidden md:block w-72 flex-shrink-0">
          <div className="sticky top-20">
            <JobFilters onFiltersChange={handleFiltersChange as Parameters<typeof JobFilters>[0]['onFiltersChange']} />
          </div>
        </aside>

        {/* Jobs Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <PageLoader />
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Search className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No jobs found</h3>
              <p className="text-gray-500 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600 px-4">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
