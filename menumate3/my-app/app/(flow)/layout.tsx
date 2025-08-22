import { ReactNode } from 'react';
import Link from 'next/link';

interface FlowLayoutProps {
  children: ReactNode;
}

export default function FlowLayout({ children }: FlowLayoutProps) {
  return (
    <div className="min-h-screen">
      {/* Preload critical flow routes */}
      <div style={{ display: 'none' }}>
        <Link href="/welcome" prefetch={true} />
        <Link href="/capture" prefetch={true} />
        <Link href="/processing" prefetch={true} />
        <Link href="/results" prefetch={true} />
        <Link href="/dish-detail" prefetch={true} />
        <Link href="/translate" prefetch={true} />
        <Link href="/filters" prefetch={true} />
        <Link href="/share" prefetch={true} />
      </div>
      {children}
    </div>
  );
}