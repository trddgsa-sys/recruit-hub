'use client';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { PageLoader } from '@/components/ui/Spinner';

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  if (status === 'loading') return <PageLoader />;
  if (!session) return null;

  return (
    <DashboardLayout
      role="CANDIDATE"
      userName={session.user.name}
      userEmail={session.user.email}
    >
      {children}
    </DashboardLayout>
  );
}
