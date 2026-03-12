'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Copy, Check } from 'lucide-react';

interface GenerateCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerated: () => void;
}

export function GenerateCodeModal({ isOpen, onClose, onGenerated }: GenerateCodeModalProps) {
  const [usageLimit, setUsageLimit] = useState('100');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/referral-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usageLimit: parseInt(usageLimit),
          expiresAt: expiresAt || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedCode(data.data.code);
        onGenerated();
      } else {
        setError(data.error ?? 'Failed to generate code');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!generatedCode) return;
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setGeneratedCode(null);
    setUsageLimit('100');
    setExpiresAt('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Generate Referral Code" size="sm">
      {generatedCode ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Your new referral code:</p>
          <div className="flex items-center gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3">
            <span className="flex-1 font-mono text-xl font-bold tracking-widest text-indigo-700 dark:text-indigo-400">
              {generatedCode}
            </span>
            <button onClick={copy} className="text-indigo-600 hover:text-indigo-700">
              {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
          <p className="text-xs text-gray-500">Share this code with candidates to unlock job applications.</p>
          <Button onClick={handleClose} className="w-full">Done</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Input
            label="Usage Limit"
            type="number"
            value={usageLimit}
            onChange={(e) => setUsageLimit(e.target.value)}
            helperText="Max number of times this code can be used"
            min="1"
            max="10000"
          />
          <Input
            label="Expiry Date (optional)"
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={handleClose} className="flex-1">Cancel</Button>
            <Button onClick={generate} loading={loading} className="flex-1">Generate Code</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
