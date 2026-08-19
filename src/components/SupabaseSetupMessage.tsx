import { useI18n } from '../i18n/I18nProvider';

export function SupabaseSetupMessage() {
  const { t } = useI18n();
  return (
    <section className="card">
      <h2>{t('setup.title')}</h2>
      <p className="message">{t('setup.text')}</p>
    </section>
  );
}
