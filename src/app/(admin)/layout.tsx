'use client';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { PageLoader } from '@/components/ui/Spinner';
import { LayoutDashboard, FileText, Users, Building2, Briefcase, UserCheck, BarChart3 } from 'lucide-react';

const adminNav = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Applications', href: '/admin/applications', icon: FileText },
  { label: 'Candidates', href: '/admin/candidates', icon: Users },
  { label: 'Companies', href: '/admin/companies', icon: Building2 },
  { label: 'Jobs', href: '/admin/jobs', icon: Briefcase },
  { label: 'Recruiters', href: '/admin/recruiters', icon: UserCheck },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  if (status === 'loading') return <PageLoader />;

  return (
    <DashboardLayout sidebarItems={adminNav} sidebarTitle="Admin">
      {children}
    </DashboardLayout>
  );
}
