import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { RecommendationPhotoState } from '../lib/useRecommendationPhotos';
import './RecommendationPhoto.css';

type Props = { name: string; state?: RecommendationPhotoState };

export function RecommendationPhoto({ name, state }: Props) {
  const { t } = useI18n();
  const [failedUrl, setFailedUrl] = useState('');
  const photo = state?.photo ?? null;
  useEffect(() => setFailedUrl(''), [photo?.url]);

  if (!state || state.loading) return <div className="recommendation-photo recommendation-photo--loading" aria-label={t('extras.photoLoading')} />;
  if (!photo || failedUrl === photo.url) return null;
  return (
    <figure className="recommendation-photo">
      <img src={photo.url} alt={t('extras.photoExactAlt', { name })} loading="lazy" decoding="async" onError={() => setFailedUrl(photo.url)} />
      <figcaption>
        <span>{t('extras.photoExact')}</span>
        <a href={photo.sourceUrl} target="_blank" rel="noreferrer" title={photo.credit}>{photo.credit}</a>
      </figcaption>
    </figure>
  );
}
