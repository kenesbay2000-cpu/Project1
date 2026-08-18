import { useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { destinations } from '../lib/destinations';
import './AIPlannerHero.css';

const journeySteps = [
  { time: '09:30', title: 'Асакуса без спешки', note: 'Храм Сэнсо-дзи · 2 часа' },
  { time: '12:15', title: 'Семейный обед', note: 'Традиционная кухня · рядом' },
  { time: '15:00', title: 'Токио с воды', note: 'Прогулка по реке · 45 минут' },
];

const heroPhotos = ['tokyo', 'istanbul', 'bali'].flatMap((slug) => {
  const image = destinations.find((destination) => destination.slug === slug)?.image;
  if (!image) return [];

  const url = new URL(image);
  url.searchParams.set('w', '1800');
  url.searchParams.set('q', '82');
  return [url.toString()];
});

export function AIPlannerHero() {
  const photoStageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = photoStageRef.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!stage || reduceMotion.matches) return undefined;

    let frameId: number | undefined;
    const updateParallax = () => {
      frameId = undefined;
      const distance = Math.min(Math.max(window.scrollY, 0), window.innerHeight);
      stage.style.setProperty('--ai-photo-parallax', `${Math.round(distance * 0.08)}px`);
    };
    const handleScroll = () => {
      if (frameId === undefined) frameId = window.requestAnimationFrame(updateParallax);
    };

    updateParallax();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frameId !== undefined) window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <section className="ai-hero" aria-labelledby="ai-hero-title">
      <div className="ai-hero__glow" aria-hidden="true" />
      <div className="ai-hero__photos" aria-hidden="true" ref={photoStageRef}>
        {heroPhotos.map((photo, index) => (
          <div className="ai-hero__photo" key={photo} style={{ animationDelay: `${index * 7}s`, backgroundImage: `url("${photo}")` }} />
        ))}
      </div>
      <div className="ai-hero__copy">
        <p className="ai-hero__eyebrow"><span /> Ваш личный AI-путеводитель</p>
        <h1 id="ai-hero-title">Опишите поездку.<br /><em>ИИ соберёт её целиком.</em></h1>
        <p className="ai-hero__lead">Короткий диалог превращается в реалистичный маршрут с жильём, транспортом, ресторанами, бюджетом и подготовкой — персонально для вас.</p>
        <p className="ai-hero__world"><span>◎</span><strong>Любое направление в мире</strong><i />Не только города из нашего каталога</p>
        <Link className="ai-hero__cta" href="/planner">Создать мою поездку <span>→</span></Link>
        <div className="ai-hero__proof" aria-label="Возможности планировщика">
          <span><b>01</b> Уточняет детали</span>
          <span><b>02</b> Проверяет реалистичность</span>
          <span><b>03</b> Собирает полный план</span>
        </div>
      </div>

      <div className="ai-hero__visual" aria-hidden="true">
        <div className="ai-demo">
          <div className="ai-demo__top"><span><i /> Roamly AI</span><small>Планирую поездку</small></div>
          <div className="ai-demo__chat">
            <p>«8 дней в Японии с ребёнком. Любим традиционную еду и спокойный темп»</p>
            <span><b>AI</b> Учту возраст, интересы и комфортную нагрузку. Маршрут готов.</span>
          </div>
          <div className="ai-demo__route">
            <header><div><small>День 3 · Токио</small><h2>Старый город и река</h2></div><span>Спокойно</span></header>
            <div className="ai-demo__steps">
              {journeySteps.map((step) => (
                <div className="ai-demo__step" key={step.time}>
                  <time>{step.time}</time><i /><p><strong>{step.title}</strong><small>{step.note}</small></p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="ai-demo__budget"><span>Ориентир бюджета</span><strong>₸ 1 480 000</strong><small>Перелёт · жильё · впечатления</small></div>
        <div className="ai-demo__ready"><span>✓</span><p><strong>План реалистичен</strong><small>Переезды и темп проверены</small></p></div>
      </div>
      <div className="ai-hero__fade" aria-hidden="true" />
    </section>
  );
}
