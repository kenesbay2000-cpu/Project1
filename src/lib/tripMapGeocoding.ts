import type { TripPlan } from './aiPlanner';
import { findTripLocation, type TripLocation } from './tripLocation';

const NOMINATIM_URL = import.meta.env.VITE_NOMINATIM_URL?.trim() || 'https://nominatim.openstreetmap.org';
const CACHE_KEY = 'roamly.trip-map-geocoding.v1';

export type TripMapPoint = {
  id: string;
  day: number;
  order: number;
  time: string;
  title: string;
  place: string;
  description: string;
  latitude: number;
  longitude: number;
};

type Coordinates = { latitude: number; longitude: number };
type Candidate = Omit<TripMapPoint, 'latitude' | 'longitude'> & { query: string; coordinates?: Coordinates };
type Cache = Record<string, Coordinates>;
type NominatimResult = { lat: string; lon: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validCoordinates(latitude: unknown, longitude: unknown): Coordinates | undefined {
  const lat = Number(latitude);
  const lon = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180
    ? { latitude: lat, longitude: lon }
    : undefined;
}

function storedCoordinates(activity: unknown) {
  if (!isRecord(activity)) return undefined;
  const coordinates = activity.coordinates;
  if (Array.isArray(coordinates)) return validCoordinates(coordinates[0], coordinates[1]);
  if (isRecord(coordinates)) {
    return validCoordinates(coordinates.latitude ?? coordinates.lat, coordinates.longitude ?? coordinates.lng ?? coordinates.lon);
  }
  return validCoordinates(activity.latitude ?? activity.lat, activity.longitude ?? activity.lng ?? activity.lon);
}

function readCache(): Cache {
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

function saveCache(cache: Cache) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(Object.entries(cache).slice(-250))));
  } catch {
    // The map remains usable without persistent caching.
  }
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase('ru-RU').replace(/\s+/g, ' ');
}

async function geocode(query: string, signal: AbortSignal): Promise<Coordinates | null> {
  const params = new URLSearchParams({ q: query, format: 'jsonv2', limit: '1', 'accept-language': 'ru' });
  const response = await fetch(`${NOMINATIM_URL}/search?${params}`, { signal });
  if (!response.ok) return null;
  const [result] = await response.json() as NominatimResult[];
  return validCoordinates(result?.lat, result?.lon) ?? null;
}

function activityCandidates(plan: TripPlan): Candidate[] {
  return plan.days.flatMap((day) => day.activities.map((activity, order) => ({
    id: `${day.day}-${order}-${activity.time}-${activity.place}`,
    day: day.day,
    order,
    time: activity.time,
    title: activity.title,
    place: activity.place || activity.title,
    description: activity.description,
    query: [activity.place || activity.title, activity.area, plan.destination.city, plan.destination.country].filter(Boolean).join(', '),
    coordinates: storedCoordinates(activity),
  }))).filter((item) => item.place.trim().length >= 2);
}

function resolvedPoints(candidates: Candidate[], resolved: Map<string, Coordinates>) {
  return candidates.flatMap(({ query, coordinates, ...candidate }) => {
    const point = coordinates ?? resolved.get(normalize(query));
    return point ? [{ ...candidate, ...point }] : [];
  });
}

export async function loadTripMapData(
  plan: TripPlan,
  signal: AbortSignal,
  onProgress: (completed: number, total: number, points: TripMapPoint[]) => void,
): Promise<{ center: TripLocation | null; points: TripMapPoint[] }> {
  const candidates = activityCandidates(plan);
  const center = await findTripLocation(plan.destination.city, plan.destination.country, signal).catch(() => null);
  const cache = readCache();
  const resolved = new Map<string, Coordinates>();
  const missingQueries: string[] = [];

  candidates.forEach((candidate) => {
    if (candidate.coordinates) return;
    const key = normalize(candidate.query);
    if (cache[key]) resolved.set(key, cache[key]);
    else if (!missingQueries.some((query) => normalize(query) === key)) missingQueries.push(candidate.query);
  });
  onProgress(0, missingQueries.length, resolvedPoints(candidates, resolved));

  let lastRequestAt = 0;
  for (let index = 0; index < missingQueries.length; index += 1) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    const query = missingQueries[index];
    const wait = Math.max(0, 1_100 - (Date.now() - lastRequestAt));
    if (wait) await new Promise((resolve) => window.setTimeout(resolve, wait));
    const coordinates = await geocode(query, signal);
    lastRequestAt = Date.now();
    if (coordinates) {
      const key = normalize(query);
      resolved.set(key, coordinates);
      cache[key] = coordinates;
      saveCache(cache);
    }
    onProgress(index + 1, missingQueries.length, resolvedPoints(candidates, resolved));
  }
  return { center, points: resolvedPoints(candidates, resolved) };
}
