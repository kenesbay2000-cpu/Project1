import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { destinations } from '../lib/destinations';
import { TripPlanner } from './TripPlanner';
import { useI18n } from '../i18n/I18nProvider';

export function HeroShowcase() {
  const { t } = useI18n();
  const [activeIndex, setActiveIndex] = useState(0);
  const active = destinations[activeIndex];

  useEffect(() => {
    const nextImage = new Image();
    nextImage.src = destinations[(activeIndex + 1) % destinations.length].image;
  }, [activeIndex]);

  const changeDestination = (step: number) => {
    setActiveIndex((current) => (current + step + destinations.length) % destinations.length);
  };

  return (
    <section className="hero" data-header-theme="dark" style={{ '--hero-photo': `url(${active.image})` } as React.CSSProperties}>
      <div className="hero__backdrop" key={active.image} />
      <div className="hero__layout">
        <div className="hero__content" key={active.city}>
          <div className="hero__eyebrow"><span /> {t('showcase.eyebrow')}</div>
          <p className="hero__country">{active.country}</p>
          <h2>{active.city}</h2>
          <p className="hero__description">{active.description}</p>
          <div className="hero__facts">
            <span><small>{t('showcase.visa')}</small>{active.visa}</span>
            <span><small>{t('showcase.bestTime')}</small>{active.season}</span>
          </div>
          <Link className="hero__details" href={`/destinations/${active.slug}`}>{t('showcase.details')} <span>↗</span></Link>
        </div>

        <aside className="destination-sheet" aria-live="polite">
          <div className="destination-sheet__top">
            <span>{active.badge}</span>
            <span>{String(activeIndex + 1).padStart(2, '0')} / {String(destinations.length).padStart(2, '0')}</span>
          </div>
          <div className="destination-sheet__price">
            <small>{active.duration}</small>
            <strong>{active.price}</strong>
          </div>
          <div className="destination-sheet__footer">
            <span className="destination-sheet__rating"><b>★ {active.rating}</b><small>{active.reviews}</small></span>
            <div className="destination-sheet__arrows">
              <button type="button" onClick={() => changeDestination(-1)} aria-label={t('showcase.previous')}>←</button>
              <button type="button" onClick={() => changeDestination(1)} aria-label={t('showcase.next')}>→</button>
            </div>
          </div>
        </aside>
      </div>
      <TripPlanner />
      <p className="hero__note">{t('showcase.note')}</p>
    </section>
  );
}
