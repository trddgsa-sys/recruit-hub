'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';
import { GenerateCodeModal } from '@/components/features/referral/GenerateCodeModal';
import { Plus, Copy, Check } from 'lucide-react';

interface CodeItem {
  id: string;
  code: string;
  usageLimit: number;
  usageCount: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  _count: { usages: number };
}

export default function ReferralCodesPage() {
  const [codes, setCodes] = useState<CodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchCodes = useCallback(async () => {
    const res = await fetch('/api/referral-codes');
    const data = await res.json();
    if (data.success) setCodes(data.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const copyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Referral Codes</h1>
        <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4" /> Generate Code</Button>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">Code</th>
                <th className="px-4 py-3 font-medium text-gray-500">Usage</th>
                <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500">Expires</th>
                <th className="px-4 py-3 font-medium text-gray-500">Created</th>
                <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {codes.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No codes yet. Generate your first one!</td></tr>
              ) : codes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="px-4 py-3"><span className="font-mono font-semibold text-indigo-600">{c.code}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${Math.min(100, (c.usageCount / c.usageLimit) * 100)}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{c.usageCount}/{c.usageLimit}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{c.isActive && (!c.expiresAt || new Date(c.expiresAt) > new Date()) ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Expired</Badge>}</td>
                  <td className="px-4 py-3 text-gray-500">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => copyCode(c.code, c.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                      {copiedId === c.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <GenerateCodeModal isOpen={showModal} onClose={() => setShowModal(false)} onGenerated={fetchCodes} />
    </div>
  );
}
