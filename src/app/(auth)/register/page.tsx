'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const params = useSearchParams();
  const defaultRole = params.get('role') === 'RECRUITER' ? 'RECRUITER' : 'CANDIDATE';

  const [form, setForm] = useState({ name: '', email: '', password: '', role: defaultRole });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? 'Registration failed');
        setLoading(false);
        return;
      }

      // Auto sign-in after registration
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        router.push('/login');
      } else {
        const path = form.role === 'RECRUITER' ? '/recruiter/dashboard' : '/candidate/dashboard';
        router.push(path);
        router.refresh();
      }
    } catch {
      setError('Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-1">Create Account</h1>
        <p className="text-gray-500 text-center text-sm mb-6">Join RecruitHub today</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Jane Doe"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            required
            minLength={8}
          />

          {/* Role Selection */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">I am a…</p>
            <div className="grid grid-cols-2 gap-3">
              {['CANDIDATE', 'RECRUITER'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => update('role', role)}
                  className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                    form.role === role
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  {role === 'CANDIDATE' ? '🔍 Job Seeker' : '🤝 Recruiter'}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          <Button type="submit" loading={loading} className="w-full">
            <UserPlus className="h-4 w-4" /> Create Account
          </Button>
        </form>
      </div>
      <p className="mt-4 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="text-indigo-600 font-medium hover:text-indigo-700">Sign In</Link>
      </p>
    </div>
  );
}
