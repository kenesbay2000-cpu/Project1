import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { getDestinations } from '../lib/content';
import { HeroDestinationCard } from './HeroDestinationCard';
import './AIPlannerHero.css';
import { useI18n } from '../i18n/I18nProvider';
import { destinationHeroSrcSet, optimizedDestinationImage } from '../lib/destinationImages';

export function AIPlannerHero() {
  const { t, language } = useI18n();
  const destinations = useMemo(() => getDestinations(language), [language]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState(0);

  useEffect(() => {
    const nextIndex = (activeIndex + 1) % destinations.length;
    const preload = new Image();
    preload.src = optimizedDestinationImage(destinations[nextIndex].image, 1600, 82);
    void preload.decode().catch(() => undefined);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduceMotion.matches) return undefined;
    const timer = window.setTimeout(() => {
      setPreviousIndex(activeIndex);
      setActiveIndex(nextIndex);
    }, 6_500);
    return () => window.clearTimeout(timer);
  }, [activeIndex, destinations]);

  const showDestination = (index: number) => {
    const normalizedIndex = (index + destinations.length) % destinations.length;
    if (normalizedIndex === activeIndex) return;
    setPreviousIndex(activeIndex);
    setActiveIndex(normalizedIndex);
  };

  const currentDestination = destinations[activeIndex];
  const previousDestination = destinations[previousIndex];

  return (
    <section className="ai-hero" data-header-theme="dark" aria-labelledby="ai-hero-title">
      <div className="ai-hero__photos" aria-hidden="true">
        <img className="ai-hero__photo ai-hero__photo--previous" src={optimizedDestinationImage(previousDestination.image, 1600, 82)} srcSet={destinationHeroSrcSet(previousDestination.image)} sizes="100vw" alt="" decoding="async" />
        <img className="ai-hero__photo ai-hero__photo--active" src={optimizedDestinationImage(currentDestination.image, 1600, 82)} srcSet={destinationHeroSrcSet(currentDestination.image)} sizes="100vw" alt="" decoding="async" key={currentDestination.image} />
      </div>
      <div className="ai-hero__shade" aria-hidden="true" />

      <div className="ai-hero__stage">
        <div className="ai-hero__copy">
          <p className="ai-hero__eyebrow"><span /> {t('hero.eyebrow')}</p>
          <h1 id="ai-hero-title">{t('hero.title')}<em>{t('hero.titleAccent')}</em></h1>
          <div className="ai-hero__support">
            <p className="ai-hero__lead">{t('hero.leadStart')} <strong>{t('hero.leadStrong')}</strong> {t('hero.leadEnd')}</p>
            <p className="ai-hero__world"><strong>{t('hero.worldStrong')}</strong> {t('hero.worldText')}</p>
          </div>
          <Link className="ai-hero__cta" href="/planner">{t('hero.cta')} <span>→</span></Link>
        </div>

        <HeroDestinationCard
          destination={currentDestination}
          index={activeIndex}
          total={destinations.length}
          onPrevious={() => showDestination(activeIndex - 1)}
          onNext={() => showDestination(activeIndex + 1)}
        />
      </div>

      <div className="ai-hero__footer">
        <div className="ai-hero__carousel">
          <p><small>{t('hero.nowShowing')}</small><strong>{currentDestination.city}</strong><span>{currentDestination.region}</span></p>
          <div className="ai-hero__dots" aria-label={t('hero.photosLabel')}>
            {destinations.map((destination, index) => (
              <button
                type="button"
                className={index === activeIndex ? 'is-active' : ''}
                aria-label={t('hero.showDestination', { city: destination.city })}
                aria-pressed={index === activeIndex}
                onClick={() => showDestination(index)}
                key={destination.slug}
              />
            ))}
          </div>
        </div>

        <Link className="ai-hero__quick-start" href="/planner">
          <span>{t('hero.quickStart')}<small>{t('hero.quickStartHint')}</small></span>
          <strong>{t('hero.startDescription')}</strong>
          <i aria-hidden="true">→</i>
        </Link>
      </div>
    </section>
  );
}
