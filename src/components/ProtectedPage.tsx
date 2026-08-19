import type { ReactNode } from 'react';
import { Link } from 'wouter';
import { useAuth } from './AuthProvider';
import { useI18n } from '../i18n/I18nProvider';

type ProtectedPageProps = {
  label: string;
  guestDescription: string;
  children: ReactNode;
};

export function ProtectedPage({ label, guestDescription, children }: ProtectedPageProps) {
  const { t } = useI18n();
  const { user, isLoading } = useAuth();

  if (isLoading) return <main className="account-page account-page--loading"><span /></main>;
  if (!user) return (
    <main className="account-page account-page--guest">
      <section><p>{label}</p><h1>{t('protected.title')}</h1><span>{guestDescription}</span><Link href="/login">{t('protected.button')}</Link></section>
    </main>
  );
  return children;
}
