import { PagePlaceholder } from '../components/PagePlaceholder';
import { useI18n } from '../i18n/I18nProvider';

export function BlogPage() {
  const { t } = useI18n();
  return (
    <PagePlaceholder
      eyebrow="Travel notes"
      title={t('common.blogTitle')}
      description={t('common.blogText')}
    />
  );
}
