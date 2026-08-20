import { useMemo } from 'react';
import { Link } from 'wouter';
import { getDestinations } from '../lib/content';
import { useI18n } from '../i18n/I18nProvider';
import { destinationPreviewSrcSet, optimizedDestinationImage } from '../lib/destinationImages';

export function DestinationGrid() {
  const { t, language } = useI18n();
  const destinations = useMemo(() => getDestinations(language), [language]);
  return (
    <div className="destinations">
      {destinations.slice(1, 5).map((destination) => (
        <Link className="destination" href={`/destinations/${destination.slug}`} key={destination.city}>
          <img className="destination__photo" src={optimizedDestinationImage(destination.image, 960)} srcSet={destinationPreviewSrcSet(destination.image)} sizes="(max-width: 780px) calc(100vw - 48px), 55vw" alt="" loading="lazy" decoding="async" />
          <span className="destination__badge">{destination.badge}</span>
          <div className="destination__body">
            <div className="destination__meta">{destination.country} · {destination.duration}</div>
            <div className="destination__row"><h3>{destination.city}</h3><div className="destination__price"><span>{t('destination.tripPrice')}</span><strong>{destination.price}</strong></div></div>
            <span className="destination__arrow">↗</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
