import { Link } from 'wouter';
import './AIPlannerHero.css';

const journeySteps = [
  { time: '09:30', title: 'Асакуса без спешки', note: 'Храм Сэнсо-дзи · 2 часа' },
  { time: '12:15', title: 'Семейный обед', note: 'Традиционная кухня · рядом' },
  { time: '15:00', title: 'Токио с воды', note: 'Прогулка по реке · 45 минут' },
];

export function AIPlannerHero() {
  return (
    <section className="ai-hero" aria-labelledby="ai-hero-title">
      <div className="ai-hero__glow" aria-hidden="true" />
      <div className="ai-hero__copy">
        <p className="ai-hero__eyebrow"><span /> Ваш личный AI-путеводитель</p>
        <h1 id="ai-hero-title">Опишите поездку.<br /><em>ИИ соберёт её целиком.</em></h1>
        <p className="ai-hero__lead">Короткий диалог превращается в реалистичный маршрут с жильём, транспортом, ресторанами, бюджетом и подготовкой — персонально для вас.</p>
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
    </section>
  );
}
