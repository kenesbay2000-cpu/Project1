import type { TripPlan } from '../lib/aiPlanner';

type TripDayCardProps = {
  day: TripPlan['days'][number];
  currency: string;
};

function formatMoney(value: number, currency: string) {
  if (value === 0) return 'Без затрат';
  return `${value.toLocaleString('ru-RU')} ${currency}`;
}

export function TripDayCard({ day, currency }: TripDayCardProps) {
  return (
    <article className="trip-day">
      <header className="trip-day__header">
        <span>День {String(day.day).padStart(2, '0')}</span>
        <h3>{day.title}</h3>
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
              <p className="trip-day__place">⌖ {activity.place}</p>
              <p>{activity.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}
