'use client';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { PageLoader } from '@/components/ui/Spinner';
import { LayoutDashboard, Link2, Users, BarChart3 } from 'lucide-react';

const recruiterNav = [
  { label: 'Dashboard', href: '/recruiter/dashboard', icon: LayoutDashboard },
  { label: 'Referral Codes', href: '/recruiter/referral-codes', icon: Link2 },
  { label: 'Candidates', href: '/recruiter/candidates', icon: Users },
  { label: 'Analytics', href: '/recruiter/analytics', icon: BarChart3 },
];

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  if (status === 'loading') return <PageLoader />;

  return (
    <DashboardLayout sidebarItems={recruiterNav} sidebarTitle="Recruiter">
      {children}
    </DashboardLayout>
  );
}
