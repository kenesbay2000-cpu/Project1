import { useEffect, useRef } from 'react';
import { Link } from 'wouter';
import './AIPlannerFeatures.css';

const planParts = [
  ['01', 'Маршрут'], ['02', 'Транспорт'], ['03', 'Жильё'],
  ['04', 'Еда'], ['05', 'Активности'], ['06', 'Бюджет'],
];

export function AIPlannerFeatures() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const elements = sectionRef.current?.querySelectorAll<HTMLElement>('[data-reveal]');
    if (!elements?.length) return;
    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.16 });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="ai-features" ref={sectionRef} data-header-theme="light" aria-labelledby="ai-features-title">
      <div className="ai-features__inner">
        <header className="ai-features__heading" data-reveal>
          <p><span /> Планирование нового поколения</p>
          <h2 id="ai-features-title">Не просто отвечает.<br /><em>Думает о поездке целиком.</em></h2>
          <div>AI Planner ведёт диалог, замечает ограничения и превращает ваши пожелания в связный план, которым действительно можно пользоваться.</div>
        </header>

        <div className="ai-features__grid">
          <article className="ai-feature ai-feature--dialog" data-reveal>
            <FeatureTitle number="01" title="Уточняет, прежде чем планировать" text="ИИ сам замечает недостающие детали и задаёт только важные вопросы." />
            <div className="feature-chat">
              <p>Хочу в Италию осенью, без спешки</p>
              <span><b>AI</b> Отлично. Вы путешествуете вдвоём? Что важнее: гастрономия, искусство или природа?</span>
              <p>Вдвоём, любим локальную кухню и маленькие города</p>
            </div>
          </article>

          <article className="ai-feature ai-feature--understand" data-reveal>
            <FeatureTitle number="02" title="Понимает свободный текст" text="Можно описать поездку своими словами — без длинной анкеты." />
            <div className="feature-prompt"><span>«10 дней в Японии, спокойно, с ребёнком, до 2 млн ₸»</span><i /></div>
            <div className="feature-tags"><span>Япония</span><span>10 дней</span><span>Семья</span><span>Спокойно</span><span>≤ 2 млн ₸</span></div>
          </article>

          <article className="ai-feature ai-feature--complete" data-reveal>
            <FeatureTitle number="03" title="Собирает полный план" text="Не подборка идей, а единая структура поездки со всеми ключевыми решениями." />
            <div className="feature-plan-parts">
              {planParts.map(([number, label]) => <span key={number}><small>{number}</small><strong>{label}</strong><i>↗</i></span>)}
            </div>
          </article>

          <article className="ai-feature ai-feature--realism" data-reveal>
            <FeatureTitle number="04" title="Проверяет реалистичность" text="Учитывает расстояния, переезды, темп и настоящую нагрузку на день." />
            <div className="feature-day"><span>09:30</span><i /><p><b>Музей Орсе</b><small>2 ч 30 мин</small></p></div>
            <div className="feature-transfer"><span>18 минут пешком</span><i>✓</i></div>
            <div className="feature-day"><span>13:00</span><i /><p><b>Обед в Сен-Жермен</b><small>Рядом · без спешки</small></p></div>
          </article>

          <article className="ai-feature ai-feature--refine" data-reveal>
            <FeatureTitle number="05" title="Меняется вместе с вами" text="Донастройте готовый результат одной короткой командой — без нового старта." />
            <div className="feature-commands"><span>Сделай поездку дешевле <i>→</i></span><span>Добавь ещё одно направление <i>→</i></span><span>Оставь больше свободного времени <i>→</i></span></div>
          </article>

          <article className="ai-feature ai-feature--saved" data-reveal>
            <FeatureTitle number="06" title="Всегда под рукой" text="Сохраняйте планы в профиле и возвращайтесь к ним в любой момент." />
            <div className="feature-saved-card"><span>12–20 октября</span><h3>Осенняя Япония</h3><p>8 дней · Токио и Киото</p><b>Сохранено <i>✓</i></b></div>
          </article>
        </div>

        <div className="ai-features__cta" data-reveal>
          <p>Ваша следующая поездка может начаться с одного предложения.</p>
          <Link href="/planner">Открыть AI Planner <span>→</span></Link>
        </div>
      </div>
      <div className="ai-features__transition"><span>Или начните с вдохновения</span><i>↓</i></div>
    </section>
  );
}

function FeatureTitle({ number, title, text }: { number: string; title: string; text: string }) {
  return <header className="ai-feature__title"><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></header>;
}
