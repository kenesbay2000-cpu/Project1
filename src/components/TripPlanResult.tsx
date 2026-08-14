import type { TripPlan } from '../lib/aiPlanner';
import { BudgetBreakdown } from './BudgetBreakdown';
import { TripDayCard } from './TripDayCard';
import './TripPlanResult.css';

type TripPlanResultProps = {
  plan: TripPlan;
  onEdit: () => void;
};

export function TripPlanResult({ plan, onEdit }: TripPlanResultProps) {
  return (
    <div className="trip-result" aria-live="polite">
      <header className="trip-result__hero">
        <button type="button" onClick={onEdit}>← Изменить запрос</button>
        <div className="trip-result__hero-copy">
          <span className="trip-result__eyebrow">Персональный маршрут готов</span>
          <h1>{plan.title}</h1>
          <p>⌖ {plan.destination.city}, {plan.destination.country}</p>
        </div>
        <div className="trip-result__facts">
          <span><strong>{plan.days.length}</strong> дней</span>
          <span><strong>{plan.placeIdeas.length}</strong> идей мест</span>
          <span><strong>{plan.budget.currency}</strong> валюта расчёта</span>
        </div>
      </header>

      <section className="trip-result__section">
        <div className="trip-result__section-heading"><span>01</span><div><p>Ваше путешествие</p><h2>Маршрут по дням</h2></div></div>
        <div className="trip-result__days">
          {plan.days.map((day) => <TripDayCard key={day.day} day={day} currency={plan.budget.currency} />)}
        </div>
      </section>

      <section className="trip-result__section">
        <div className="trip-result__section-heading"><span>02</span><div><p>Стоит увидеть</p><h2>Идеи конкретных мест</h2></div></div>
        <div className="trip-places">
          {plan.placeIdeas.map((place) => (
            <article key={`${place.type}-${place.name}`}>
              <span>{place.type}</span><h3>{place.name}</h3><p>{place.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="trip-result__section">
        <div className="trip-result__section-heading"><span>03</span><div><p>План расходов</p><h2>Бюджет поездки</h2></div></div>
        <BudgetBreakdown budget={plan.budget} />
      </section>

      <aside className="trip-rationale">
        <span>Почему именно такой маршрут</span><p>{plan.rationale}</p>
      </aside>
      <button className="trip-result__restart" type="button" onClick={onEdit}>Изменить запрос и создать новый маршрут →</button>
    </div>
  );
}
