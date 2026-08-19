import { useEffect, useMemo, useState } from 'react';
import type { GeneratedTrip } from '../lib/aiPlanner';
import { destinationGuides } from '../lib/destinationGuides';
import { findCatalogDestination } from '../lib/tripLocation';
import { loadTripWeather, type TripForecastDay } from '../lib/tripWeather';
import { useI18n } from '../i18n/I18nProvider';

function tripDates(trip: GeneratedTrip) {
  return {
    start: trip.request.dates?.start ?? trip.plan.days[0]?.date,
    end: trip.request.dates?.end ?? trip.plan.days[trip.plan.days.length - 1]?.date,
  };
}

export function SavedPlanWeather({ trip }: { trip: GeneratedTrip }) {
  const { t, language } = useI18n();
  const locale = language === 'ru' ? 'ru-RU' : 'en-US';
  const weatherLabel = (code: number) => code === 0 ? { icon: '☀', label: t('weather.clear') } : code <= 3 ? { icon: '◑', label: t('weather.cloudy') } : [45, 48].includes(code) ? { icon: '≋', label: t('weather.fog') } : code >= 71 && code <= 86 ? { icon: '❄', label: t('weather.snow') } : code >= 95 ? { icon: 'ϟ', label: t('weather.storm') } : { icon: '☂', label: t('weather.rain') };
  const dates = useMemo(() => tripDates(trip), [trip]);
  const catalog = findCatalogDestination(trip.plan.destination.city, trip.plan.destination.country);
  const [forecast, setForecast] = useState<TripForecastDay[]>([]);
  const [latitude, setLatitude] = useState<number | undefined>(catalog?.coordinates[0]);
  const [isLoading, setIsLoading] = useState(true);
  const guide = catalog ? destinationGuides[catalog.slug] : undefined;
  const tripMonth = dates.start && /^\d{4}-\d{2}-\d{2}$/.test(dates.start) ? Number(dates.start.slice(5, 7)) - 1 : new Date().getMonth();
  const shiftedMonth = latitude !== undefined && latitude < 0 ? (tripMonth + 6) % 12 : tripMonth;
  const season = latitude !== undefined && Math.abs(latitude) < 23.5 ? t('weather.tropical') : [2, 3, 4].includes(shiftedMonth) ? t('weather.spring') : [5, 6, 7].includes(shiftedMonth) ? t('weather.summer') : [8, 9, 10].includes(shiftedMonth) ? t('weather.autumn') : t('weather.winter');

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    void loadTripWeather(trip.plan.destination.city, trip.plan.destination.country, dates.start, dates.end, controller.signal)
      .then((result) => { setForecast(result.forecast); setLatitude(result.location?.latitude); })
      .catch(() => { setForecast([]); })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    return () => controller.abort();
  }, [dates.end, dates.start, trip.plan.destination.city, trip.plan.destination.country]);

  return (
    <div className="saved-weather">
      <section className="saved-weather__season">
        <span>{season}</span>
        <h2>{guide ? guide.bestTime : t('weather.fallbackTitle')}</h2>
        <p>{guide?.climate ?? t('weather.fallbackText')}</p>
      </section>
      {isLoading && <div className="saved-weather__state" role="status">{t('weather.checking')}</div>}
      {!isLoading && forecast.length > 0 && <section className="saved-weather__forecast">
        <header><span>{t('weather.current')}</span><p>{t('weather.currentNote')}</p></header>
        <div>{forecast.map((day) => { const weather = weatherLabel(day.weatherCode); return <article key={day.date}><time>{new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${day.date}T00:00:00`))}</time><b>{weather.icon}</b><strong>{Math.round(day.temperatureMax)}° / {Math.round(day.temperatureMin)}°</strong><span>{weather.label}</span><small>{t('weather.precipitation', { value: day.precipitationProbability })}</small></article>; })}</div>
      </section>}
      {!isLoading && forecast.length === 0 && <div className="saved-weather__state">{t('weather.unavailable')}</div>}
      <small className="saved-weather__source">{t('weather.sourceStart')} <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>. {t('weather.sourceEnd')}</small>
    </div>
  );
}
