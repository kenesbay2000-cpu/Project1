import { findTripLocation, type TripLocation } from './tripLocation';
import { summarizeClimate, tripMonthDays, type HistoricalWeatherDays, type TripClimateSummary } from './weatherClimate';

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

type HistoricalResponse = {
  daily?: {
    precipitation_sum: Array<number | null>;
    temperature_2m_max: Array<number | null>;
    temperature_2m_min: Array<number | null>;
    time: string[];
    weather_code: Array<number | null>;
  };
};

export type TripWeatherResult = {
  climate: TripClimateSummary | null;
  forecast: TripForecastDay[];
  kind: 'climate' | 'forecast' | 'unavailable';
  location: TripLocation | null;
};

const CLIMATE_CACHE_PREFIX = 'roamly.weather-climate.v1';
const CLIMATE_CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

function climateCacheKey(location: TripLocation, start: string, end: string, baselineStartYear: number, baselineEndYear: number) {
  return `${CLIMATE_CACHE_PREFIX}:${location.latitude.toFixed(3)}:${location.longitude.toFixed(3)}:${start.slice(5)}:${end.slice(5)}:${baselineStartYear}-${baselineEndYear}`;
}

function readClimateCache(key: string) {
  if (typeof window === 'undefined') return null;
  try {
    const cached = JSON.parse(window.localStorage.getItem(key) ?? '') as { expiresAt?: number; value?: TripClimateSummary };
    return cached.expiresAt && cached.expiresAt > Date.now() && cached.value ? cached.value : null;
  } catch {
    return null;
  }
}

function writeClimateCache(key: string, value: TripClimateSummary) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify({ expiresAt: Date.now() + CLIMATE_CACHE_TTL, value }));
  } catch { /* Weather remains available when browser storage is disabled. */ }
}

function isIsoDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function forecastRange(start?: string, end?: string) {
  if (!isIsoDate(start) || !isIsoDate(end)) return null;
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  const lastForecastDay = new Date(today);
  lastForecastDay.setUTCDate(lastForecastDay.getUTCDate() + 15);
  const requestedStart = new Date(`${start}T00:00:00Z`);
  const requestedEnd = new Date(`${end}T00:00:00Z`);
  if (requestedStart < today || requestedEnd > lastForecastDay || requestedEnd < requestedStart) return null;
  return { start, end };
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

function hasEveryTripDay(forecast: TripForecastDay[], start: string, end: string) {
  const expected = tripMonthDays(start, end).length;
  return expected > 0 && forecast.length === expected;
}

async function loadClimate(location: TripLocation, start: string, end: string, signal: AbortSignal) {
  const monthDays = tripMonthDays(start, end);
  if (!monthDays.length) return null;
  const baselineEndYear = new Date().getUTCFullYear() - 1;
  const baselineStartYear = baselineEndYear - 19;
  const cacheKey = climateCacheKey(location, start, end, baselineStartYear, baselineEndYear);
  const cached = readClimateCache(cacheKey);
  if (cached) return cached;
  const params = new URLSearchParams({
    latitude: String(location.latitude), longitude: String(location.longitude), timezone: 'auto', models: 'era5',
    start_date: `${baselineStartYear}-01-01`, end_date: `${baselineEndYear}-12-31`,
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum',
  });
  const response = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params}`, { signal });
  if (!response.ok) return null;
  const data = await response.json() as HistoricalResponse;
  if (!data.daily) return null;
  const days: HistoricalWeatherDays = {
    time: data.daily.time,
    weatherCode: data.daily.weather_code,
    temperatureMax: data.daily.temperature_2m_max,
    temperatureMin: data.daily.temperature_2m_min,
    precipitation: data.daily.precipitation_sum,
  };
  const climate = summarizeClimate(days, monthDays, baselineStartYear, baselineEndYear);
  if (climate) writeClimateCache(cacheKey, climate);
  return climate;
}

export async function loadTripWeather(city: string, country: string, start: string | undefined, end: string | undefined, signal: AbortSignal): Promise<TripWeatherResult> {
  const location = await findTripLocation(city, country, signal);
  if (!location || !isIsoDate(start) || !isIsoDate(end)) return { location, forecast: [], climate: null, kind: 'unavailable' };
  const range = forecastRange(start, end);
  if (range) {
    try {
      const forecast = await loadForecast(location, range.start, range.end, signal);
      if (hasEveryTripDay(forecast, range.start, range.end)) return { location, forecast, climate: null, kind: 'forecast' };
    } catch (error) {
      if (signal.aborted) throw error;
    }
  }
  const climate = await loadClimate(location, start, end, signal);
  return { location, forecast: [], climate, kind: climate ? 'climate' : 'unavailable' };
}
