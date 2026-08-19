import { Link } from 'wouter';
import { useI18n } from '../i18n/I18nProvider';

export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <main className="placeholder-page">
      <section className="placeholder-card">
        <span>404</span>
        <h1>{t('common.notFoundTitle')}</h1>
        <p>
          <Link href="/">{t('common.home')}</Link>
        </p>
      </section>
    </main>
  );
}
