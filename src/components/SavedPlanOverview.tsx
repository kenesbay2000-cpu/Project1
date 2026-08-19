import type { GeneratedTrip } from '../lib/aiPlanner';
import { SavePlanButton } from './SavePlanButton';
import { TripPlanEditor } from './TripPlanEditor';
import { TripRealismNotice } from './TripRealismNotice';

type SavedPlanOverviewProps = {
  trip: GeneratedTrip;
  onEdit?: () => void;
  onTripUpdated?: (trip: GeneratedTrip) => void;
};

function formatDates(trip: GeneratedTrip) {
  const start = trip.request.dates?.start ?? trip.plan.days[0]?.date;
  const end = trip.request.dates?.end ?? trip.plan.days[trip.plan.days.length - 1]?.date;
  if (!start || !end || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) return 'Даты в маршруте';
  const formatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${formatter.format(new Date(`${start}T00:00:00`))} — ${formatter.format(new Date(`${end}T00:00:00`))}`;
}

export function SavedPlanOverview({ trip, onEdit, onTripUpdated }: SavedPlanOverviewProps) {
  const { plan, request } = trip;
  return (
    <div className="saved-overview">
      <header className="saved-overview__hero" data-header-theme="dark">
        {onEdit && <button className="saved-overview__edit" type="button" onClick={onEdit}>← Изменить запрос</button>}
        <span>{onEdit ? 'Персональный маршрут готов' : 'Сохранённое путешествие'}</span>
        <h1>{plan.title}</h1>
        <p>⌖ {plan.destination.city}, {plan.destination.country}</p>
        <div>
          <strong><b>{plan.days.length}</b> дней</strong>
          <strong><b>{request.travelers ?? '—'}</b> путешественников</strong>
          <strong><b>{plan.budget.total.toLocaleString('ru-RU')}</b> {plan.budget.currency}</strong>
        </div>
      </header>
      <div className="saved-overview__dates"><span>Период поездки</span><strong>{formatDates(trip)}</strong></div>
      {onEdit && <SavePlanButton key={`${trip.id}-${trip.request.routeEdits?.length ?? 0}`} trip={trip} />}
      <TripRealismNotice assessment={plan.realism} />
      {onTripUpdated && <TripPlanEditor trip={trip} onUpdated={onTripUpdated} />}
      <section className="saved-overview__rationale"><span>Логика плана</span><h2>Почему маршрут устроен именно так</h2><p>{plan.rationale}</p></section>
      <section className="saved-overview__group">
        <header><span>↗</span><div><p>Дорога и перемещения</p><h2>Транспорт</h2></div></header>
        <div className="saved-card-grid">{plan.transport.map((item, index) => <article key={`${item.mode}-${index}`}><small>{item.mode}</small><h3>{item.route}</h3><p>{item.recommendation}</p></article>)}</div>
      </section>
      <section className="saved-overview__group">
        <header><span>⌖</span><div><p>Главные ориентиры</p><h2>Идеи мест</h2></div></header>
        <div className="saved-card-grid">{plan.placeIdeas.map((item, index) => <article key={`${item.name}-${index}`}><small>{item.type}</small><h3>{item.name}</h3><p>{item.description}</p></article>)}</div>
      </section>
    </div>
  );
}
