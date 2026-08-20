import { Link } from 'wouter';
import { useI18n } from '../i18n/I18nProvider';
import type { Destination } from '../lib/destinations';
import { destinationPreviewSrcSet, optimizedDestinationImage } from '../lib/destinationImages';

type Props = {
  destination: Destination;
  isActive: boolean;
  position: number;
  total: number;
  shouldLoadPhoto: boolean;
  onMove: (step: number) => void;
};

export function ThemedDestinationSlide({ destination, isActive, position, total, shouldLoadPhoto, onMove }: Props) {
  const { t } = useI18n();
  return (
    <article className={`themed-slide${isActive ? ' is-active' : ''}`} aria-hidden={!isActive}>
      <div className="themed-slide__photo">
        {shouldLoadPhoto && <img src={optimizedDestinationImage(destination.image, 960)} srcSet={destinationPreviewSrcSet(destination.image)} sizes="(min-width: 1370px) 1040px, (max-width: 820px) 88vw, 76vw" alt="" loading={isActive ? 'eager' : 'lazy'} decoding="async" />}
      </div>
      {isActive ? (
        <div className="themed-slide__layout">
          <div className="themed-slide__content">
            <span>{destination.country}</span><h2>{destination.city}</h2><p>{destination.description}</p>
            <div className="themed-slide__facts"><span><small>{t('showcase.visa')}</small>{destination.visa}</span><span><small>{t('showcase.bestTime')}</small>{destination.season}</span></div>
            <Link href={`/destinations/${destination.slug}`}>{t('showcase.details')} <span>↗</span></Link>
          </div>
          <aside className="themed-slide__sheet" aria-live="polite">
            <div><span>{destination.badge}</span><span>{String(position).padStart(2, '0')} / {String(total).padStart(2, '0')}</span></div>
            <p><small>{destination.duration}</small><strong>{destination.price}</strong></p>
            <footer><span><b>★ {destination.rating}</b><small>{destination.reviews}</small></span><div><button type="button" onClick={() => onMove(-1)} aria-label={t('showcase.previous')}>←</button><button type="button" onClick={() => onMove(1)} aria-label={t('showcase.next')}>→</button></div></footer>
          </aside>
        </div>
      ) : (
        <div className="themed-slide__preview"><span>{destination.country}</span><h2>{destination.city}</h2><p><strong>{destination.price}</strong><small>★ {destination.rating}</small></p></div>
      )}
    </article>
  );
}
