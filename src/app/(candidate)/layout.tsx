'use client';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { PageLoader } from '@/components/ui/Spinner';
import { LayoutDashboard, FileText, User, Star } from 'lucide-react';

const candidateNav = [
  { label: 'Dashboard', href: '/candidate/dashboard', icon: LayoutDashboard },
  { label: 'My Applications', href: '/candidate/applications', icon: FileText },
  { label: 'Profile', href: '/candidate/profile', icon: User },
  { label: 'Saved Jobs', href: '/candidate/saved-jobs', icon: Star },
];

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  if (status === 'loading') return <PageLoader />;

  return (
    <DashboardLayout sidebarItems={candidateNav} sidebarTitle="Candidate">
      {children}
    </DashboardLayout>
  );
}
