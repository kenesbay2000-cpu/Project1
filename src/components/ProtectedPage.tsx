import type { ReactNode } from 'react';
import { Link } from 'wouter';
import { useAuth } from './AuthProvider';

type ProtectedPageProps = {
  label: string;
  guestDescription: string;
  children: ReactNode;
};

export function ProtectedPage({ label, guestDescription, children }: ProtectedPageProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <main className="account-page account-page--loading"><span /></main>;
  if (!user) return (
    <main className="account-page account-page--guest">
      <section><p>{label}</p><h1>Сначала войдите</h1><span>{guestDescription}</span><Link href="/login">Перейти ко входу →</Link></section>
    </main>
  );
  return children;
}
