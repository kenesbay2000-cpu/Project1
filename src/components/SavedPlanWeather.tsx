import { useEffect, useMemo, useState } from 'react';
import type { GeneratedTrip } from '../lib/aiPlanner';
import { destinationGuides } from '../lib/destinationGuides';
import { findCatalogDestination } from '../lib/tripLocation';
import { loadTripWeather, type TripForecastDay } from '../lib/tripWeather';

function weatherLabel(code: number) {
  if (code === 0) return { icon: '☀', label: 'Ясно' };
  if (code <= 3) return { icon: '◑', label: 'Переменная облачность' };
  if ([45, 48].includes(code)) return { icon: '≋', label: 'Туман' };
  if (code >= 71 && code <= 86) return { icon: '❄', label: 'Снег' };
  if (code >= 95) return { icon: 'ϟ', label: 'Гроза' };
  return { icon: '☂', label: 'Возможны осадки' };
}

function seasonName(month: number, latitude?: number) {
  if (latitude !== undefined && Math.abs(latitude) < 23.5) return 'Тропический сезон';
  const shiftedMonth = latitude !== undefined && latitude < 0 ? (month + 6) % 12 : month;
  if ([2, 3, 4].includes(shiftedMonth)) return 'Весенний сезон';
  if ([5, 6, 7].includes(shiftedMonth)) return 'Летний сезон';
  if ([8, 9, 10].includes(shiftedMonth)) return 'Осенний сезон';
  return 'Зимний сезон';
}

function tripDates(trip: GeneratedTrip) {
  return {
    start: trip.request.dates?.start ?? trip.plan.days[0]?.date,
    end: trip.request.dates?.end ?? trip.plan.days[trip.plan.days.length - 1]?.date,
  };
}

export function SavedPlanWeather({ trip }: { trip: GeneratedTrip }) {
  const dates = useMemo(() => tripDates(trip), [trip]);
  const catalog = findCatalogDestination(trip.plan.destination.city, trip.plan.destination.country);
  const [forecast, setForecast] = useState<TripForecastDay[]>([]);
  const [latitude, setLatitude] = useState<number | undefined>(catalog?.coordinates[0]);
  const [isLoading, setIsLoading] = useState(true);
  const guide = catalog ? destinationGuides[catalog.slug] : undefined;
  const tripMonth = dates.start && /^\d{4}-\d{2}-\d{2}$/.test(dates.start) ? Number(dates.start.slice(5, 7)) - 1 : new Date().getMonth();

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
        <span>{seasonName(tripMonth, latitude)}</span>
        <h2>{guide ? guide.bestTime : 'Погода зависит от конкретного региона и высоты — проверьте прогноз ближе к выезду.'}</h2>
        <p>{guide?.climate ?? 'Это сезонный ориентир, а не метеорологический прогноз. Для упаковки вещей учитывайте перепады температуры, вероятность осадков и местные предупреждения.'}</p>
      </section>
      {isLoading && <div className="saved-weather__state" role="status">Проверяем, доступен ли прогноз на даты поездки…</div>}
      {!isLoading && forecast.length > 0 && <section className="saved-weather__forecast">
        <header><span>Актуальный прогноз</span><p>Доступен для ближайших дат и может меняться.</p></header>
        <div>{forecast.map((day) => { const weather = weatherLabel(day.weatherCode); return <article key={day.date}><time>{new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${day.date}T00:00:00`))}</time><b>{weather.icon}</b><strong>{Math.round(day.temperatureMax)}° / {Math.round(day.temperatureMin)}°</strong><span>{weather.label}</span><small>Осадки: {day.precipitationProbability}%</small></article>; })}</div>
      </section>}
      {!isLoading && forecast.length === 0 && <div className="saved-weather__state">Точный прогноз пока недоступен для этих дат. Вернитесь в этот раздел за 1–2 недели до поездки.</div>}
      <small className="saved-weather__source">Прогноз для ближайших дат: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>. Сезонный текст — ориентир, а не гарантия погоды.</small>
    </div>
  );
}
