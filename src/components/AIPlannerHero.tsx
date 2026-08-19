import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { destinations } from '../lib/destinations';
import './AIPlannerHero.css';

type HeroPhoto = {
  city: string;
  region: string;
  image: string;
  position?: string;
};

const catalogImage = (slug: string) => {
  const image = destinations.find((destination) => destination.slug === slug)?.image;
  if (!image) return '';
  const url = new URL(image);
  url.searchParams.set('w', '2200');
  url.searchParams.set('q', '88');
  return url.toString();
};

const heroPhotos: HeroPhoto[] = [
  {
    city: 'Барбадос',
    region: 'Карибское море',
    image: 'https://images.unsplash.com/photo-1633847016580-b7a15cc813d7?auto=format&fit=crop&w=2200&q=88',
    position: 'center 58%',
  },
  { city: 'Сингапур', region: 'Юго-Восточная Азия', image: catalogImage('singapore'), position: 'center 58%' },
  { city: 'Токио', region: 'Япония', image: catalogImage('tokyo'), position: 'center' },
  { city: 'Рим', region: 'Италия', image: catalogImage('rome'), position: 'center 48%' },
  { city: 'Бали', region: 'Индонезия', image: catalogImage('bali'), position: 'center 54%' },
].filter((photo) => photo.image);

export function AIPlannerHero() {
  const [activePhoto, setActivePhoto] = useState(0);
  const [previousPhoto, setPreviousPhoto] = useState(0);

  useEffect(() => {
    const nextPhoto = (activePhoto + 1) % heroPhotos.length;
    const preload = new Image();
    preload.src = heroPhotos[nextPhoto].image;
    void preload.decode().catch(() => undefined);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduceMotion.matches) return undefined;
    const timer = window.setTimeout(() => {
      setPreviousPhoto(activePhoto);
      setActivePhoto(nextPhoto);
    }, 6_500);
    return () => window.clearTimeout(timer);
  }, [activePhoto]);

  const showPhoto = (index: number) => {
    if (index === activePhoto) return;
    setPreviousPhoto(activePhoto);
    setActivePhoto(index);
  };

  const currentPhoto = heroPhotos[activePhoto];
  const previous = heroPhotos[previousPhoto];

  return (
    <section className="ai-hero" aria-labelledby="ai-hero-title">
      <div className="ai-hero__photos" aria-hidden="true">
        <img className="ai-hero__photo ai-hero__photo--previous" src={previous.image} alt="" style={{ objectPosition: previous.position }} />
        <img className="ai-hero__photo ai-hero__photo--active" src={currentPhoto.image} alt="" style={{ objectPosition: currentPhoto.position }} key={currentPhoto.image} />
      </div>
      <div className="ai-hero__shade" aria-hidden="true" />

      <div className="ai-hero__copy">
        <p className="ai-hero__eyebrow"><span /> Ваш личный AI-путеводитель</p>
        <h1 id="ai-hero-title">Опишите <br className="ai-hero__mobile-break" />поездку.<em>ИИ соберёт её целиком.</em></h1>
        <div className="ai-hero__support">
          <p className="ai-hero__lead">Короткий диалог превращается в <strong>реалистичный маршрут</strong> с жильём, транспортом, ресторанами, бюджетом и подготовкой — персонально для вас.</p>
          <p className="ai-hero__world"><strong>От Барбадоса до Сингапура — и куда угодно ещё.</strong> Эти кадры лишь начало: Roamly спланирует поездку в любой город и направление мира.</p>
        </div>
        <Link className="ai-hero__cta" href="/planner">Создать мою поездку <span>→</span></Link>
      </div>

      <div className="ai-hero__footer">
        <div className="ai-hero__carousel">
          <p><small>Сейчас в кадре</small><strong>{currentPhoto.city}</strong><span>{currentPhoto.region}</span></p>
          <div className="ai-hero__dots" aria-label="Фотографии направлений">
            {heroPhotos.map((photo, index) => (
              <button
                type="button"
                className={index === activePhoto ? 'is-active' : ''}
                aria-label={`Показать направление: ${photo.city}`}
                aria-pressed={index === activePhoto}
                onClick={() => showPhoto(index)}
                key={photo.city}
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
