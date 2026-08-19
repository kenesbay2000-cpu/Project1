import { Link } from 'wouter';
import type { Destination } from '../lib/destinations';
import { useI18n } from '../i18n/I18nProvider';

type Props = { destination: Destination; onClose: () => void };

export function MapDestinationPreview({ destination, onClose }: Props) {
  const { t } = useI18n();
  return (
    <article className="map-preview">
      <div className="map-preview__photo">
        <img src={destination.image} alt={`${destination.city}, ${destination.country}`} />
        <button type="button" onClick={onClose} aria-label={t('map.close')}>×</button>
        <span>{destination.visa}</span>
      </div>
      <div className="map-preview__body">
        <p>{destination.country} · ★ {destination.rating}</p>
        <h2>{destination.city}</h2>
        <div><span>{t('map.tripEstimate')}</span><strong>{destination.price}</strong></div>
        <Link href={`/destinations/${destination.slug}`}>{t('map.openGuide')} <span>→</span></Link>
      </div>
    </article>
  );
}
