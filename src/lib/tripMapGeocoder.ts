import {
  searchNominatim, searchPhoton, validCoordinates,
  type Coordinates, type ProviderResult,
} from './tripMapProvider';

const CACHE_KEY = 'roamly.trip-map-geocoding.v2';

export type { Coordinates } from './tripMapProvider';
export type GeocodingCache = Record<string, Coordinates>;
export type GeocodingResult = ProviderResult;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function storedActivityCoordinates(activity: unknown) {
  if (!isRecord(activity)) return undefined;
  const coordinates = activity.coordinates;
  if (Array.isArray(coordinates)) return validCoordinates(coordinates[0], coordinates[1]);
  if (isRecord(coordinates)) {
    return validCoordinates(coordinates.latitude ?? coordinates.lat, coordinates.longitude ?? coordinates.lng ?? coordinates.lon);
  }
  return validCoordinates(activity.latitude ?? activity.lat, activity.longitude ?? activity.lng ?? activity.lon);
}

export function normalizeMapQuery(value: string) {
  return value.trim().toLocaleLowerCase('ru-RU').replace(/\s+/g, ' ');
}

export function readGeocodingCache(): GeocodingCache {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? '{}');
    if (!isRecord(value)) return {};
    return Object.fromEntries(Object.entries(value).flatMap(([key, item]) => {
      if (!isRecord(item)) return [];
      const coordinates = validCoordinates(item.latitude, item.longitude);
      return coordinates ? [[key, coordinates]] : [];
    }));
  } catch {
    return {};
  }
}

export function saveGeocodingCache(cache: GeocodingCache) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(Object.entries(cache).slice(-250))));
  } catch {
    // Карта остаётся рабочей, даже если браузер запретил локальное хранилище.
  }
}

export function geocodeMapQuery(query: string, center: Coordinates | null, signal: AbortSignal) {
  return searchNominatim(query, center, signal);
}

export function geocodeMapFallback(query: string, center: Coordinates | null, signal: AbortSignal): Promise<ProviderResult> {
  return center ? searchPhoton(query, center, signal) : Promise.resolve({ status: 'empty' });
}
