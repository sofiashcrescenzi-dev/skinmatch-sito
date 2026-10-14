import type { Metadata } from 'next';
import Guscio from '@/components/admin/Guscio';

export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Guscio>{children}</Guscio>;
}
