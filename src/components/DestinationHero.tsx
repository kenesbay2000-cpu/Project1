import type { CSSProperties } from 'react';
import { Link } from 'wouter';
import type { Destination } from '../lib/destinations';

type DestinationHeroProps = { destination: Destination; lead: string };

export function DestinationHero({ destination, lead }: DestinationHeroProps) {
  const heroStyle = { '--destination-photo': `url(${destination.image})` } as CSSProperties;

  return (
    <header className="article-hero" style={heroStyle}>
      <img src={destination.image} alt={`Панорама направления ${destination.city}`} fetchPriority="high" />
      <div className="article-hero__shade" />
      <div className="article-hero__content">
        <Link className="article-hero__back" href="/#ideas">← Все направления</Link>
        <p className="article-kicker">{destination.country} <span /> Путеводитель</p>
        <h1>{destination.city}</h1>
        <p className="article-hero__lead">{lead}</p>
        <div className="article-hero__meta">
          <span>{destination.season}</span>
          <span>{destination.duration.split(' · ')[0]}</span>
          <span>Обновлено 12 августа 2026</span>
        </div>
      </div>
      <a className="article-hero__scroll" href="#guide" aria-label="Перейти к путеводителю">↓</a>
    </header>
  );
}
