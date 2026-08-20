import type { GeneratedTrip } from '../lib/aiPlanner';
import { useI18n } from '../i18n/I18nProvider';
import { formatTripDateRange, formatTripDayDate, formatTripMoney } from '../lib/tripExportFormatting';
import { PrintSection, PrintableTripCollections } from './PrintableTripCollections';

export function PrintableTripPlan({ trip }: { trip: GeneratedTrip }) {
  const { t, language } = useI18n();
  const { plan, request } = trip;
  const routePoints = collectRoutePoints(trip);
  return <article className="plan-print-document" aria-hidden="true">
    <header className="plan-print-cover">
      <strong>ROAMLY</strong><span>{t('export.documentLabel')}</span><h1>{plan.title}</h1>
      <p>{plan.destination.city}, {plan.destination.country}</p>
      <dl>
        <div><dt>{t('export.period')}</dt><dd>{formatTripDateRange(trip, language, t('overview.datesFallback'))}</dd></div>
        <div><dt>{t('export.travelers')}</dt><dd>{request.travelers ?? '—'}</dd></div>
        <div><dt>{t('export.totalBudget')}</dt><dd>{formatTripMoney(plan.budget.total, plan.budget.currency, language)}</dd></div>
      </dl>
    </header>
    <PrintSection title={t('export.planningLogic')}><p>{plan.rationale}</p>
      <div className="plan-print-realism"><strong>{t('export.realism')}</strong><p>{plan.realism.warning}</p>
        {plan.realism.adjustments.length > 0 && <ul>{plan.realism.adjustments.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>}
      </div>
    </PrintSection>
    <PrintSection title={t('workspace.itinerary')}><div className="plan-print-days">{plan.days.map((day) =>
      <section className="plan-print-day" key={day.day}>
        <header><div><small>{t('trip.day', { day: day.day })}</small><h3>{day.title}</h3></div><time>{formatTripDayDate(day.date, language)}</time></header>
        {day.activities.map((activity, index) => <div className="plan-print-stop" key={`${activity.time}-${activity.title}-${index}`}>
          <b>{activity.time}</b><div><h4>{activity.title}</h4><small>{[activity.place, activity.area].filter(Boolean).join(' · ')}</small>
            <p>{activity.description}</p><em>{activity.durationMinutes} min · {formatTripMoney(activity.estimatedCost, plan.budget.currency, language)}</em></div>
        </div>)}
      </section>)}</div></PrintSection>
    <PrintSection title={t('export.routePoints')}><p className="plan-print-note">{t('export.routePointsNote')}</p>
      {routePoints.length ? <ol className="plan-print-route">{routePoints.map((point) => <li key={point.key}><b>{t('trip.day', { day: point.day })}</b> — {point.place}{point.area && ` · ${point.area}`}</li>)}</ol> : <p>{t('export.noRoutePoints')}</p>}
    </PrintSection>
    <PrintableTripCollections trip={trip} language={language} t={t} />
  </article>;
}

function collectRoutePoints(trip: GeneratedTrip) {
  const seen = new Set<string>();
  return trip.plan.days.flatMap((day) => day.activities.flatMap((activity) => {
    const place = activity.place.trim();
    const key = `${place}|${activity.area}`.toLocaleLowerCase();
    if (!place || seen.has(key)) return [];
    seen.add(key);
    return [{ key, day: day.day, place, area: activity.area }];
  }));
}
