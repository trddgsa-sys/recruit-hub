'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, XCircle } from 'lucide-react';

interface ReferralCodeInputProps {
  onSuccess?: (recruiterName: string) => void;
}

export function ReferralCodeInput({ onSuccess }: ReferralCodeInputProps) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const validate = async () => {
    if (!code.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/referral-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.toUpperCase().trim() }),
      });
      const data = await res.json();
      if (data.success && data.data?.valid) {
        setStatus('success');
        setMessage(`Code accepted! Referred by ${data.data.recruiterName}`);
        onSuccess?.(data.data.recruiterName);
      } else {
        setStatus('error');
        setMessage(data.error ?? 'Invalid referral code');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="REC-AB12X9"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setStatus('idle');
          }}
          className="font-mono tracking-widest uppercase"
          maxLength={10}
          onKeyDown={(e) => e.key === 'Enter' && validate()}
        />
        <Button onClick={validate} loading={status === 'loading'} disabled={!code.trim()}>
          Validate
        </Button>
      </div>
      {status === 'success' && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {message}
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <XCircle className="h-4 w-4 flex-shrink-0" />
          {message}
        </div>
      )}
    </div>
  );
}
