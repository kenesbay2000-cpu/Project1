import type { TripPlan } from '../lib/aiPlanner';

type BudgetBreakdownProps = {
  budget: TripPlan['budget'];
};

function describeEstimate(note: string) {
  const isTypical = /^\s*\[ТИПИЧНЫЕ ЦЕНЫ\]/i.test(note);
  const cleaned = note.replace(/^\s*\[(?:ТИПИЧНЫЕ ЦЕНЫ|ГРУБАЯ ОЦЕНКА)\]\s*/i, '');
  return {
    label: isTypical ? 'Расчёт по типичным ценам' : 'Грубая оценка',
    kind: isTypical ? 'typical' : 'rough',
    note: cleaned || 'Стоимость зависит от сезона и доступности.',
  };
}

export function BudgetBreakdown({ budget }: BudgetBreakdownProps) {
  const formatMoney = (value: number) => `${value.toLocaleString('ru-RU')} ${budget.currency}`;

  return (
    <section className="trip-budget">
      <div className="trip-budget__summary">
        <span>Ориентировочный бюджет</span>
        <strong>{formatMoney(budget.total)}</strong>
        <p>Сводная оценка, а не цена бронирования. Финальная стоимость зависит от сезона и доступности.</p>
        <div className="trip-budget__legend"><span>● Типичные цены</span><span>○ Грубая оценка</span></div>
      </div>
      <div className="trip-budget__categories">
        {budget.categories.map((item) => {
          const percentage = budget.total > 0 ? Math.min(100, Math.round(item.amount / budget.total * 100)) : 0;
          const estimate = describeEstimate(item.note);
          return (
            <div className="trip-budget__category" key={item.category}>
              <div><strong>{item.category}</strong><span>{formatMoney(item.amount)}</span></div>
              <div className="trip-budget__bar"><span style={{ width: `${percentage}%` }} /></div>
              <small className={`trip-budget__accuracy trip-budget__accuracy--${estimate.kind}`}>{estimate.label}</small>
              <p>{estimate.note}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
