import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SessionProviderWrapper } from './SessionProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RecruitHub — Referral-Based Hiring Platform',
  description: 'Connect with top companies through recruiter referrals. Apply for jobs with an exclusive referral code.',
  keywords: ['jobs', 'recruitment', 'referral', 'hiring', 'careers'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
