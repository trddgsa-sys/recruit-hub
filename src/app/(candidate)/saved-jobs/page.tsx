'use client';
import { Card, CardBody } from '@/components/ui/Card';
import { Star } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function SavedJobsPage() {
  // Saved jobs feature — uses client-side state for now.
  // Full implementation would fetch from /api/saved-jobs endpoint.
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Saved Jobs</h1>
      <Card>
        <CardBody className="py-12 text-center">
          <Star className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No saved jobs yet</h3>
          <p className="text-gray-500 mb-4">Browse jobs and save the ones you&apos;re interested in.</p>
          <Link href="/jobs"><Button>Browse Jobs</Button></Link>
        </CardBody>
      </Card>
    </div>
  );
}
