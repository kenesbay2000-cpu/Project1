import type { TripPlan } from '../lib/aiPlanner';

type BudgetBreakdownProps = {
  budget: TripPlan['budget'];
};

export function BudgetBreakdown({ budget }: BudgetBreakdownProps) {
  const formatMoney = (value: number) => `${value.toLocaleString('ru-RU')} ${budget.currency}`;

  return (
    <section className="trip-budget">
      <div className="trip-budget__summary">
        <span>Ориентировочный бюджет</span>
        <strong>{formatMoney(budget.total)}</strong>
        <p>Финальная стоимость зависит от сезона и доступности.</p>
      </div>
      <div className="trip-budget__categories">
        {budget.categories.map((item) => {
          const percentage = budget.total > 0 ? Math.min(100, Math.round(item.amount / budget.total * 100)) : 0;
          return (
            <div className="trip-budget__category" key={item.category}>
              <div><strong>{item.category}</strong><span>{formatMoney(item.amount)}</span></div>
              <div className="trip-budget__bar"><span style={{ width: `${percentage}%` }} /></div>
              <p>{item.note}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
