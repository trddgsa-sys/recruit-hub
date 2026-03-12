'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Briefcase, Bell, User, ChevronDown, LogOut, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const dashboardPath =
    session?.user?.role === 'ADMIN'     ? '/admin/dashboard' :
    session?.user?.role === 'RECRUITER' ? '/recruiter/dashboard' :
    session?.user?.role === 'CANDIDATE' ? '/candidate/dashboard' : null;

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600">
            <Briefcase className="h-6 w-6" />
            <span>RecruitHub</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/jobs" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition-colors">
              Browse Jobs
            </Link>
            <Link href="/unlock" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition-colors">
              Enter Referral Code
            </Link>
          </div>

          {/* Auth */}
          <div className="flex items-center gap-3">
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-indigo-300 transition-colors"
                >
                  <div className="h-7 w-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 text-xs font-bold">
                    {session.user.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="hidden sm:inline max-w-[120px] truncate">{session.user.name}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-1 w-48 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-1 z-50">
                    {dashboardPath && (
                      <Link
                        href={dashboardPath}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => setMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4" /> Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => { setMenuOpen(false); signOut({ callbackUrl: '/' }); }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Log In</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
