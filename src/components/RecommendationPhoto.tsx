import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { RecommendationPhoto as Photo } from '../lib/aiPlannerTypes';
import './RecommendationPhoto.css';

type Props = { name: string; photo?: Photo };

export function RecommendationPhoto({ name, photo }: Props) {
  const { t } = useI18n();
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>('loading');
  useEffect(() => setStatus('loading'), [photo?.url]);

  if (!photo || status === 'failed') return null;
  return (
    <figure className={`recommendation-photo recommendation-photo--${status}`} aria-busy={status === 'loading'}>
      <img src={photo.url} alt={t('extras.photoExactAlt', { name })} loading="lazy" decoding="async"
        onLoad={() => setStatus('loaded')} onError={() => setStatus('failed')} />
      {status === 'loaded' && <figcaption>
        <span>{t('extras.photoExact')}</span>
        {photo.sourceUrl
          ? <a href={photo.sourceUrl} target="_blank" rel="noreferrer" title={photo.credit}>{photo.credit}</a>
          : <span>{photo.credit}</span>}
      </figcaption>}
      {status === 'loading' && <span className="recommendation-photo__loading">{t('extras.photoLoading')}</span>}
    </figure>
  );
}
