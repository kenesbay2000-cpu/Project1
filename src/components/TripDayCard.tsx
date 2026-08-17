import type { TripPlan } from '../lib/aiPlanner';

type TripDayCardProps = {
  day: TripPlan['days'][number];
  currency: string;
};

function formatMoney(value: number, currency: string) {
  if (value === 0) return 'Без затрат';
  return `${value.toLocaleString('ru-RU')} ${currency}`;
}

const paceLabels = { active: 'Насыщенный день', balanced: 'Спокойный темп', rest: 'День отдыха' };

function formatDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date(`${value}T00:00:00`));
}

export function TripDayCard({ day, currency }: TripDayCardProps) {
  return (
    <article className="trip-day">
      <header className="trip-day__header">
        <span>День {String(day.day).padStart(2, '0')}</span>
        <h3>{day.title}</h3>
        {(day.date || day.pace) && <div className="trip-day__meta">{day.date && <small>{formatDate(day.date)}</small>}{day.pace && <small>{paceLabels[day.pace]}</small>}</div>}
      </header>
      <ol className="trip-day__timeline">
        {day.activities.map((activity, index) => (
          <li key={`${activity.time}-${activity.title}-${index}`}>
            <div className="trip-day__time">{activity.time}</div>
            <div className="trip-day__activity">
              <div className="trip-day__activity-heading">
                <h4>{activity.title}</h4>
                <span>{formatMoney(activity.estimatedCost, currency)}</span>
              </div>
              {(typeof activity.durationMinutes === 'number' || typeof activity.travelMinutesFromPrevious === 'number') && <p className="trip-day__timing">{typeof activity.durationMinutes === 'number' && `Около ${activity.durationMinutes} мин`}{activity.travelMinutesFromPrevious > 0 && ` · Переезд ${activity.travelMinutesFromPrevious} мин`}</p>}
              <p className="trip-day__place">⌖ {activity.place}{activity.area ? ` · ${activity.area}` : ''}</p>
              <p>{activity.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}
