import type { TripPlan } from '../lib/aiPlanner';
import { useI18n } from '../i18n/I18nProvider';
import { languageLocale } from '../i18n/locale';

type TripDayCardProps = {
  day: TripPlan['days'][number];
  currency: string;
};

function formatDate(value: string | undefined, locale: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(new Date(`${value}T00:00:00`));
}

export function TripDayCard({ day, currency }: TripDayCardProps) {
  const { t, language } = useI18n();
  const locale = languageLocale(language);
  const formatMoney = (value: number) => value === 0 ? t('trip.noCost') : `${value.toLocaleString(locale)} ${currency}`;
  const paceLabels = { active: t('trip.activePace'), balanced: t('trip.balancedPace'), rest: t('trip.restPace') };
  return (
    <article className="trip-day">
      <header className="trip-day__header">
        <span>{t('trip.day', { day: String(day.day).padStart(2, '0') })}</span>
        <h3>{day.title}</h3>
        {(day.date || day.pace) && <div className="trip-day__meta">{day.date && <small>{formatDate(day.date, locale)}</small>}{day.pace && <small>{paceLabels[day.pace]}</small>}</div>}
      </header>
      <ol className="trip-day__timeline">
        {day.activities.map((activity, index) => (
          <li key={`${activity.time}-${activity.title}-${index}`}>
            <div className="trip-day__time">{activity.time}</div>
            <div className="trip-day__activity">
              <div className="trip-day__activity-heading">
                <h4>{activity.title}</h4>
                <span>{formatMoney(activity.estimatedCost)}</span>
              </div>
              {(typeof activity.durationMinutes === 'number' || typeof activity.travelMinutesFromPrevious === 'number') && <p className="trip-day__timing">{typeof activity.durationMinutes === 'number' && t('trip.aboutMinutes', { minutes: activity.durationMinutes })}{activity.travelMinutesFromPrevious > 0 && ` · ${t('trip.transferMinutes', { minutes: activity.travelMinutesFromPrevious })}`}</p>}
              <p className="trip-day__place">⌖ {activity.place}{activity.area ? ` · ${activity.area}` : ''}</p>
              <p>{activity.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}
