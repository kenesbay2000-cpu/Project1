import { Link } from 'wouter';
import { useI18n } from '../i18n/I18nProvider';

type PagePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PagePlaceholder({ eyebrow, title, description }: PagePlaceholderProps) {
  const { t } = useI18n();
  return (
    <main className="placeholder-page">
      <section className="placeholder-card">
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        <Link href="/">← {t('common.home')}</Link>
      </section>
    </main>
  );
}
