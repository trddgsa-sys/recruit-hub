'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from '@/components/ui/Toast'

interface ApplyModalProps {
  isOpen: boolean
  onClose: () => void
  job: {
    id: string
    title: string
    company: { name: string }
  }
  referralCode?: string
  resumeUrl?: string | null
}

export function ApplyModal({ isOpen, onClose, job, referralCode, resumeUrl }: ApplyModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [appResumeUrl, setAppResumeUrl] = useState(resumeUrl || '')

  const handleApply = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          referralCode: referralCode || undefined,
          resumeUrl: appResumeUrl || undefined,
          notes: notes || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit application')
      }

      toast({
        title: 'Application Submitted!',
        description: `Your application for ${job.title} has been submitted.`,
        variant: 'success',
      })

      onClose()
      router.push('/candidate/applications')
    } catch (error) {
      toast({
        title: 'Application Failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Apply for {job.title}</DialogTitle>
          <DialogDescription>
            Submit your application to <strong>{job.company.name}</strong>
            {referralCode && (
              <span className="block mt-1 text-green-600 dark:text-green-400">
                ✓ Applying with referral code: <strong>{referralCode}</strong>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Resume URL
            </label>
            <input
              type="url"
              placeholder="https://your-resume.com/resume.pdf"
              value={appResumeUrl}
              onChange={(e) => setAppResumeUrl(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500">Link to your resume or LinkedIn profile</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cover Letter / Notes (optional)
            </label>
            <textarea
              rows={4}
              placeholder="Tell us why you're a great fit for this role..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={2000}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">{notes.length}/2000 characters</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleApply} loading={loading}>
            Submit Application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
