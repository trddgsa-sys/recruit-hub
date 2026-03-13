'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ReferralCodeInput } from '@/components/features/referral/ReferralCodeInput';
import { Key, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function UnlockPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(false);

  const handleSuccess = (_recruiterName: string) => {
    setUnlocked(true);
    setTimeout(() => router.push('/jobs'), 2000);
  };

  if (!session) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Sign In Required</h1>
        <p className="text-gray-500 mb-6">You need to be logged in as a candidate to use a referral code.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/login" className="rounded-xl bg-indigo-600 text-white px-6 py-2.5 font-medium hover:bg-indigo-700 transition-colors">Log In</Link>
          <Link href="/register" className="rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2.5 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Register</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
          <Key className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Enter Referral Code</h1>
        <p className="text-gray-500 mt-2">
          Enter the code you received from your recruiter to unlock full job details and apply.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <ReferralCodeInput onSuccess={handleSuccess} />
        {unlocked && (
          <p className="mt-4 text-sm text-green-600 text-center">
            Redirecting you to job listings...
          </p>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-gray-400">
        Don&apos;t have a code? Contact a recruiter or check your email.
      </p>
    </div>
  );
}
