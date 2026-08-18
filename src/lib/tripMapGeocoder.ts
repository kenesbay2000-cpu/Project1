const NOMINATIM_URL = import.meta.env.VITE_NOMINATIM_URL?.trim() || 'https://nominatim.openstreetmap.org';
const CACHE_KEY = 'roamly.trip-map-geocoding.v1';

export type Coordinates = { latitude: number; longitude: number };
export type GeocodingCache = Record<string, Coordinates>;
export type GeocodingResult =
  | { status: 'success'; coordinates: Coordinates }
  | { status: 'empty' }
  | { status: 'error'; error: string };

type NominatimResult = { lat: string; lon: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validCoordinates(latitude: unknown, longitude: unknown): Coordinates | undefined {
  const lat = Number(latitude);
  const lon = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180
    ? { latitude: lat, longitude: lon }
    : undefined;
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
    // The map remains usable without persistent caching.
  }
}

export async function geocodeMapQuery(query: string, signal: AbortSignal): Promise<GeocodingResult> {
  try {
    const params = new URLSearchParams({ q: query, format: 'jsonv2', limit: '1', 'accept-language': 'ru' });
    const response = await fetch(`${NOMINATIM_URL}/search?${params}`, { signal });
    if (!response.ok) return { status: 'error', error: `HTTP ${response.status} ${response.statusText}`.trim() };
    const [result] = await response.json() as NominatimResult[];
    if (!result) return { status: 'empty' };
    const coordinates = validCoordinates(result.lat, result.lon);
    return coordinates ? { status: 'success', coordinates } : { status: 'error', error: 'Ответ содержит некорректные координаты.' };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    return { status: 'error', error: error instanceof Error ? error.message : 'Неизвестная сетевая ошибка.' };
  }
}
