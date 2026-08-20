import { useEffect, useMemo, useState } from 'react';
import type { GeneratedTrip } from '../lib/aiPlanner';
import { loadTripWeather, type TripWeatherResult } from '../lib/tripWeather';
import { useI18n } from '../i18n/I18nProvider';
import { languageLocale } from '../i18n/locale';

const EMPTY_WEATHER: TripWeatherResult = { climate: null, forecast: [], kind: 'unavailable', location: null };

function tripDates(trip: GeneratedTrip) {
  return {
    start: trip.request.dates?.start ?? trip.plan.days[0]?.date,
    end: trip.request.dates?.end ?? trip.plan.days[trip.plan.days.length - 1]?.date,
  };
}

export function SavedPlanWeather({ trip }: { trip: GeneratedTrip }) {
  const { t, language } = useI18n();
  const locale = languageLocale(language);
  const dates = useMemo(() => tripDates(trip), [trip]);
  const [weather, setWeather] = useState<TripWeatherResult>(EMPTY_WEATHER);
  const [isLoading, setIsLoading] = useState(true);
  const weatherLabel = (code: number) => code === 0
    ? { icon: '☀', label: t('weather.clear') }
    : code <= 3 ? { icon: '◑', label: t('weather.cloudy') }
      : [45, 48].includes(code) ? { icon: '≋', label: t('weather.fog') }
        : code >= 71 && code <= 86 ? { icon: '❄', label: t('weather.snow') }
          : code >= 95 ? { icon: 'ϟ', label: t('weather.storm') }
            : { icon: '☂', label: t('weather.rain') };

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setWeather(EMPTY_WEATHER);
    void loadTripWeather(
      trip.plan.destination.city,
      trip.plan.destination.country,
      dates.start,
      dates.end,
      controller.signal,
    ).then((result) => { if (!controller.signal.aborted) setWeather(result); }).catch(() => {
      if (!controller.signal.aborted) setWeather(EMPTY_WEATHER);
    }).finally(() => {
      if (!controller.signal.aborted) setIsLoading(false);
    });
    return () => controller.abort();
  }, [dates.end, dates.start, trip.plan.destination.city, trip.plan.destination.country]);

  const climate = weather.climate;
  const climateCondition = climate ? weatherLabel(climate.dominantWeatherCode) : null;
  const isForecast = weather.kind === 'forecast';
  return (
    <div className="saved-weather">
      <section className={`saved-weather__notice saved-weather__notice--${isForecast ? 'forecast' : 'climate'}`}>
        <span>{t(isForecast ? 'weather.forecastLabel' : 'weather.climateLabel')}</span>
        <h2>{t(isForecast ? 'weather.forecastNotice' : 'weather.climateNotice')}</h2>
        <p>{t(isForecast ? 'weather.forecastExplanation' : 'weather.climateExplanation')}</p>
      </section>

      {isLoading && <div className="saved-weather__state" role="status">{t('weather.checking')}</div>}
      {!isLoading && climate && climateCondition && <section className="saved-weather__climate">
        <header>
          <span>{t('weather.climateTitle')}</span>
          <p>{t('weather.climatePeriod', { start: climate.baselineStartYear, end: climate.baselineEndYear })}</p>
        </header>
        <div>
          <article><small>{t('weather.temperature')}</small><strong>{Math.round(climate.averageTemperatureMax)}° / {Math.round(climate.averageTemperatureMin)}°</strong><span>{t('weather.dayNight')}</span></article>
          <article><small>{t('weather.rainfall')}</small><strong>{climate.averageDailyPrecipitation.toFixed(1)} mm</strong><span>{t('weather.dailyAverage')}</span></article>
          <article><small>{t('weather.wetDays')}</small><strong>{Math.round(climate.wetDayPercentage)}%</strong><span>{t('weather.daysInPeriod')}</span></article>
          <article><small>{t('weather.typicalConditions')}</small><b>{climateCondition.icon}</b><span>{climateCondition.label}</span></article>
        </div>
      </section>}
      {!isLoading && isForecast && <section className="saved-weather__forecast">
        <header><span>{t('weather.current')}</span><p>{t('weather.currentNote')}</p></header>
        <div>{weather.forecast.map((day) => {
          const condition = weatherLabel(day.weatherCode);
          return <article key={day.date}>
            <time>{new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${day.date}T00:00:00`))}</time>
            <b>{condition.icon}</b><strong>{Math.round(day.temperatureMax)}° / {Math.round(day.temperatureMin)}°</strong>
            <span>{condition.label}</span><small>{t('weather.precipitation', { value: day.precipitationProbability })}</small>
          </article>;
        })}</div>
      </section>}
      {!isLoading && weather.kind === 'unavailable' && <div className="saved-weather__state">{t('weather.unavailable')}</div>}
      <small className="saved-weather__source">
        {t(isForecast ? 'weather.forecastSource' : 'weather.climateSource')} <a href={isForecast ? 'https://open-meteo.com/en/docs' : 'https://open-meteo.com/en/docs/historical-weather-api'} target="_blank" rel="noreferrer">Open-Meteo</a>.
      </small>
    </div>
  );
}
