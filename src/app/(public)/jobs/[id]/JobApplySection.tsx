'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { CheckCircle2, Send } from 'lucide-react';

interface JobApplySectionProps {
  jobId: string;
  jobTitle: string;
  session: { user: { role: string } } | null;
}

export function JobApplySection({ jobId, jobTitle, session }: JobApplySectionProps) {
  const [showModal, setShowModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState('');

  if (!session || session.user.role !== 'CANDIDATE') return null;

  const handleApply = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, notes: notes || null }),
      });
      const data = await res.json();
      if (data.success) {
        setApplied(true);
      } else {
        setError(data.error ?? 'Failed to apply');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (applied) {
    return (
      <div className="mt-6 rounded-2xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-3" />
        <h3 className="text-xl font-semibold text-green-800 dark:text-green-300">Application Submitted!</h3>
        <p className="text-green-600 dark:text-green-400 mt-1">We&apos;ll notify you as it progresses.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-6 text-center">
        <Button size="lg" onClick={() => setShowModal(true)} className="px-10">
          <Send className="h-4 w-4 mr-2" /> Apply for This Position
        </Button>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`Apply: ${jobTitle}`} size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Your profile and resume will be submitted. Add an optional note below.
          </p>
          <Input
            label="Cover Note (optional)"
            placeholder="Why are you a great fit for this role?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleApply} loading={loading} className="flex-1">Submit Application</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
