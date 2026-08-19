import type { CSSProperties } from 'react';
import { Link } from 'wouter';
import type { Destination } from '../lib/destinations';
import { useI18n } from '../i18n/I18nProvider';

type DestinationHeroProps = { destination: Destination; lead: string };

export function DestinationHero({ destination, lead }: DestinationHeroProps) {
  const { t } = useI18n();
  const heroStyle = { '--destination-photo': `url(${destination.image})` } as CSSProperties;

  return (
    <header className="article-hero" data-header-theme="dark" style={heroStyle}>
      <img src={destination.image} alt={t('guide.panorama', { city: destination.city })} fetchPriority="high" />
      <div className="article-hero__shade" />
      <div className="article-hero__content">
        <Link className="article-hero__back" href="/#ideas">← {t('guide.all')}</Link>
        <p className="article-kicker">{destination.country} <span /> {t('guide.label')}</p>
        <h1>{destination.city}</h1>
        <p className="article-hero__lead">{lead}</p>
        <div className="article-hero__meta">
          <span>{destination.season}</span>
          <span>{destination.duration.split(' · ')[0]}</span>
          <span>{t('guide.updated')}</span>
        </div>
      </div>
      <a className="article-hero__scroll" href="#guide" aria-label={t('guide.scroll')}>↓</a>
    </header>
  );
}
