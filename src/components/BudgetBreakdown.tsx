import type { TripPlan } from '../lib/aiPlanner';
import { useI18n } from '../i18n/I18nProvider';
import { languageLocale } from '../i18n/locale';

type BudgetBreakdownProps = {
  budget: TripPlan['budget'];
};

function describeEstimate(note: string, typical: string, rough: string, fallback: string) {
  const isTypical = /^\s*\[ТИПИЧНЫЕ ЦЕНЫ\]/i.test(note);
  const cleaned = note.replace(/^\s*\[(?:ТИПИЧНЫЕ ЦЕНЫ|ГРУБАЯ ОЦЕНКА)\]\s*/i, '');
  return {
    label: isTypical ? typical : rough,
    kind: isTypical ? 'typical' : 'rough',
    note: cleaned || fallback,
  };
}

export function BudgetBreakdown({ budget }: BudgetBreakdownProps) {
  const { t, language } = useI18n();
  const formatMoney = (value: number) => `${value.toLocaleString(languageLocale(language))} ${budget.currency}`;

  return (
    <section className="trip-budget">
      <div className="trip-budget__summary">
        <span>{t('budget.eyebrow')}</span>
        <strong>{formatMoney(budget.total)}</strong>
        <p>{t('budget.note')}</p>
        <div className="trip-budget__legend"><span>{t('budget.typicalLegend')}</span><span>{t('budget.roughLegend')}</span></div>
      </div>
      <div className="trip-budget__categories">
        {budget.categories.map((item) => {
          const percentage = budget.total > 0 ? Math.min(100, Math.round(item.amount / budget.total * 100)) : 0;
          const estimate = describeEstimate(item.note, t('budget.typical'), t('budget.rough'), t('budget.fallback'));
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
