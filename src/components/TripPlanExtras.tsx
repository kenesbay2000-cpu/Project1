import type { TripPlan } from '../lib/aiPlanner';
import './TripPlanExtras.css';

type TripPlanExtrasProps = { plan: TripPlan };

export function TripPlanExtras({ plan }: TripPlanExtrasProps) {
  const transport = plan.transport ?? [];
  const accommodations = plan.accommodations ?? [];
  const food = plan.food ?? [];
  const activities = plan.activities ?? [];
  const usefulLinks = plan.usefulLinks ?? [];
  const checklist = plan.checklist ?? [];
  if (![transport, accommodations, food, activities, usefulLinks, checklist].some((items) => items.length)) return null;

  const formatNight = (price: number) => `${price.toLocaleString('ru-RU')} ${plan.budget.currency} / ночь`;
  return (
    <div className="trip-guide">
      <section className="trip-guide__block trip-guide__block--wide">
        <header><span>↗</span><div><p>Дорога и город</p><h3>Транспорт</h3></div></header>
        <div className="trip-guide__list trip-guide__list--columns">
          {transport.map((item, index) => <article key={`${item.mode}-${index}`}><strong>{item.mode}</strong><h4>{item.route}</h4><p>{item.recommendation}</p></article>)}
        </div>
      </section>

      <section className="trip-guide__block trip-guide__block--wide">
        <header><span>⌂</span><div><p>Где остановиться</p><h3>Варианты жилья</h3></div></header>
        <div className="trip-guide__list trip-guide__list--columns">
          {accommodations.map((item, index) => <article key={`${item.name}-${index}`}><strong>{item.type} · {item.area}</strong><h4>{item.name}</h4><b>{formatNight(item.pricePerNight)}</b><p>{item.description}</p></article>)}
        </div>
      </section>

      <section className="trip-guide__block">
        <header><span>◌</span><div><p>Вкус направления</p><h3>Рестораны и еда</h3></div></header>
        <div className="trip-guide__list">{food.map((item, index) => <article key={`${item.name}-${index}`}><strong>{item.cuisine} · {item.priceLevel}</strong><h4>{item.name}</h4><p>{item.description}</p></article>)}</div>
      </section>

      <section className="trip-guide__block">
        <header><span>◇</span><div><p>Общий обзор</p><h3>Активности</h3></div></header>
        <div className="trip-guide__list">{activities.map((item, index) => <article key={`${item.name}-${index}`}><strong>{item.category}</strong><h4>{item.name}</h4><p>{item.summary}</p></article>)}</div>
      </section>

      <section className="trip-guide__block">
        <header><span>i</span><div><p>Перед поездкой</p><h3>Полезные ссылки</h3></div></header>
        <div className="trip-guide__list">{usefulLinks.map((item, index) => <article key={`${item.title}-${index}`}><h4>{item.title}</h4><p>{item.recommendation}</p></article>)}</div>
      </section>

      <section className="trip-guide__block trip-guide__block--checklist">
        <header><span>✓</span><div><p>Ничего не забыть</p><h3>Подготовка / чек-лист</h3></div></header>
        <ol>{checklist.map((item, index) => <li key={`${item.task}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{item.task}</strong><small>{item.timing}</small><p>{item.details}</p></div></li>)}</ol>
      </section>
    </div>
  );
}
