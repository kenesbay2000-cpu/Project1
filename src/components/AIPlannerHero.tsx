import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { destinations } from '../lib/destinations';
import { HeroDestinationCard } from './HeroDestinationCard';
import './AIPlannerHero.css';

export function AIPlannerHero() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState(0);

  useEffect(() => {
    const nextIndex = (activeIndex + 1) % destinations.length;
    const preload = new Image();
    preload.src = destinations[nextIndex].image;
    void preload.decode().catch(() => undefined);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduceMotion.matches) return undefined;
    const timer = window.setTimeout(() => {
      setPreviousIndex(activeIndex);
      setActiveIndex(nextIndex);
    }, 6_500);
    return () => window.clearTimeout(timer);
  }, [activeIndex]);

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
        <img className="ai-hero__photo ai-hero__photo--previous" src={previousDestination.image} alt="" />
        <img className="ai-hero__photo ai-hero__photo--active" src={currentDestination.image} alt="" key={currentDestination.image} />
      </div>
      <div className="ai-hero__shade" aria-hidden="true" />

      <div className="ai-hero__stage">
        <div className="ai-hero__copy">
          <p className="ai-hero__eyebrow"><span /> Ваш личный AI-путеводитель</p>
          <h1 id="ai-hero-title">Опишите <br className="ai-hero__mobile-break" />поездку.<em>ИИ соберёт её целиком.</em></h1>
          <div className="ai-hero__support">
            <p className="ai-hero__lead">Короткий диалог превращается в <strong>реалистичный маршрут</strong> с жильём, транспортом, ресторанами, бюджетом и подготовкой — персонально для вас.</p>
            <p className="ai-hero__world"><strong>От Стамбула до Нячанга — и куда угодно ещё.</strong> Эти кадры лишь начало: Roamly спланирует поездку в любой город и направление мира.</p>
          </div>
          <Link className="ai-hero__cta" href="/planner">Создать мою поездку <span>→</span></Link>
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
          <p><small>Сейчас в кадре</small><strong>{currentDestination.city}</strong><span>{currentDestination.region}</span></p>
          <div className="ai-hero__dots" aria-label="Фотографии направлений">
            {destinations.map((destination, index) => (
              <button
                type="button"
                className={index === activeIndex ? 'is-active' : ''}
                aria-label={`Показать направление: ${destination.city}`}
                aria-pressed={index === activeIndex}
                onClick={() => showDestination(index)}
                key={destination.slug}
              />
            ))}
          </div>
        </div>

        <Link className="ai-hero__quick-start" href="/planner">
          <span>Быстрый старт<small>Расскажите, какой должна быть ваша поездка</small></span>
          <strong>Начать описание</strong>
          <i aria-hidden="true">→</i>
        </Link>
      </div>
    </section>
  );
}
