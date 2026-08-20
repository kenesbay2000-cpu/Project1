import type { GeneratedTrip } from '../lib/aiPlanner';
import { SavePlanButton } from './SavePlanButton';
import { TripPlanEditor } from './TripPlanEditor';
import { TripRealismNotice } from './TripRealismNotice';
import { useI18n } from '../i18n/I18nProvider';
import { languageLocale } from '../i18n/locale';

type SavedPlanOverviewProps = {
  trip: GeneratedTrip;
  onEdit?: () => void;
  onTripUpdated?: (trip: GeneratedTrip) => void;
};

function formatDates(trip: GeneratedTrip, locale: string, fallback: string) {
  const start = trip.request.dates?.start ?? trip.plan.days[0]?.date;
  const end = trip.request.dates?.end ?? trip.plan.days[trip.plan.days.length - 1]?.date;
  if (!start || !end || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) return fallback;
  const formatter = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  return `${formatter.format(new Date(`${start}T00:00:00`))} — ${formatter.format(new Date(`${end}T00:00:00`))}`;
}

export function SavedPlanOverview({ trip, onEdit, onTripUpdated }: SavedPlanOverviewProps) {
  const { t, language } = useI18n();
  const locale = languageLocale(language);
  const { plan, request } = trip;
  return (
    <div className="saved-overview">
      <header className="saved-overview__hero" data-header-theme="dark">
        {onEdit && <button className="saved-overview__edit" type="button" onClick={onEdit}>← {t('overview.edit')}</button>}
        <span>{onEdit ? t('overview.ready') : t('overview.savedTrip')}</span>
        <h1>{plan.title}</h1>
        <p>⌖ {plan.destination.city}, {plan.destination.country}</p>
        <div>
          <strong><b>{request.expectedDays ?? plan.days.length}</b> {t('overview.days')}</strong>
          <strong><b>{request.travelers ?? '—'}</b> {t('overview.travelers')}</strong>
          <strong><b>{plan.budget.total.toLocaleString(locale)}</b> {plan.budget.currency}</strong>
        </div>
      </header>
      <div className="saved-overview__dates"><span>{t('overview.period')}</span><strong>{formatDates(trip, locale, t('overview.datesFallback'))}</strong></div>
      {onEdit && <SavePlanButton key={`${trip.id}-${trip.request.routeEdits?.length ?? 0}`} trip={trip} />}
      <TripRealismNotice assessment={plan.realism} />
      {onTripUpdated && !(request.deferredSections?.length) && <TripPlanEditor trip={trip} onUpdated={onTripUpdated} />}
      <section className="saved-overview__rationale"><span>{t('overview.logic')}</span><h2>{t('overview.why')}</h2><p>{plan.rationale}</p></section>
      <section className="saved-overview__group">
        <header><span>↗</span><div><p>{t('overview.transportEyebrow')}</p><h2>{t('overview.transport')}</h2></div></header>
        <div className="saved-card-grid">{plan.transport.map((item, index) => <article key={`${item.mode}-${index}`}><small>{item.mode}</small><h3>{item.route}</h3><p>{item.recommendation}</p></article>)}</div>
      </section>
      <section className="saved-overview__group">
        <header><span>⌖</span><div><p>{t('overview.landmarks')}</p><h2>{t('overview.placeIdeas')}</h2></div></header>
        <div className="saved-card-grid">{plan.placeIdeas.map((item, index) => <article key={`${item.name}-${index}`}><small>{item.type}</small><h3>{item.name}</h3><p>{item.description}</p></article>)}</div>
      </section>
    </div>
  );
}
