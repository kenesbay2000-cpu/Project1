import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { RecommendationPhoto as Photo } from '../lib/placePhotoFallbacks';
import type { RecommendationPhotoState } from '../lib/useRecommendationPhotos';
import './RecommendationPhoto.css';

type Props = { name: string; state?: RecommendationPhotoState; fallback: Photo };

export function RecommendationPhoto({ name, state, fallback }: Props) {
  const { t } = useI18n();
  const [failedUrl, setFailedUrl] = useState('');
  const requested = state?.photo ?? fallback;
  const photo = failedUrl === requested.url ? fallback : requested;
  useEffect(() => setFailedUrl(''), [requested.url]);

  if (!state || state.loading) return <div className="recommendation-photo recommendation-photo--loading" aria-label={t('extras.photoLoading')} />;
  const illustrative = photo.match === 'illustrative';
  return (
    <figure className="recommendation-photo">
      <img src={photo.url} alt={illustrative ? t('extras.photoIllustrativeAlt', { name }) : t('extras.photoExactAlt', { name })} loading="lazy" decoding="async" onError={() => setFailedUrl(photo.url)} />
      <figcaption>
        <span>{illustrative ? t('extras.photoIllustrative') : t('extras.photoExact')}</span>
        <a href={photo.sourceUrl} target="_blank" rel="noreferrer" title={photo.credit}>{photo.credit}</a>
      </figcaption>
    </figure>
  );
}
