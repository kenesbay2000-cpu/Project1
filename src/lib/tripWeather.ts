import { findTripLocation, type TripLocation } from './tripLocation';

export type TripForecastDay = {
  date: string;
  weatherCode: number;
  temperatureMin: number;
  temperatureMax: number;
  precipitationProbability: number;
};

type ForecastResponse = {
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_min: number[];
    temperature_2m_max: number[];
    precipitation_probability_max: number[];
  };
};

function isIsoDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function forecastRange(start?: string, end?: string) {
  if (!isIsoDate(start) || !isIsoDate(end)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastForecastDay = new Date(today);
  lastForecastDay.setDate(lastForecastDay.getDate() + 15);
  const requestedStart = new Date(`${start}T00:00:00`);
  const requestedEnd = new Date(`${end}T00:00:00`);
  if (requestedEnd < today || requestedStart > lastForecastDay) return null;
  return { start: requestedStart < today ? today.toISOString().slice(0, 10) : start, end };
}

async function loadForecast(location: TripLocation, start: string, end: string, signal: AbortSignal) {
  const params = new URLSearchParams({
    latitude: String(location.latitude), longitude: String(location.longitude), timezone: 'auto',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    forecast_days: '16',
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal });
  if (!response.ok) return [];
  const data = await response.json() as ForecastResponse;
  if (!data.daily) return [];
  return data.daily.time.map((date, index) => ({
    date,
    weatherCode: data.daily?.weather_code[index] ?? 0,
    temperatureMin: data.daily?.temperature_2m_min[index] ?? 0,
    temperatureMax: data.daily?.temperature_2m_max[index] ?? 0,
    precipitationProbability: data.daily?.precipitation_probability_max[index] ?? 0,
  })).filter((day) => day.date >= start && day.date <= end);
}

export async function loadTripWeather(city: string, country: string, start: string | undefined, end: string | undefined, signal: AbortSignal) {
  const location = await findTripLocation(city, country, signal);
  const range = forecastRange(start, end);
  const forecast = location && range ? await loadForecast(location, range.start, range.end, signal) : [];
  return { location, forecast };
}
