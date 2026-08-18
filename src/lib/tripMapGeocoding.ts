import type { TripPlan } from './aiPlanner';
import { findTripLocation, type TripLocation } from './tripLocation';

const NOMINATIM_URL = import.meta.env.VITE_NOMINATIM_URL?.trim() || 'https://nominatim.openstreetmap.org';
const CACHE_KEY = 'roamly.trip-map-geocoding.v1';
const MAX_ACTIVITY_POINTS = 8;

export type TripMapPoint = {
  id: string;
  label: string;
  context: string;
  latitude: number;
  longitude: number;
};

type CachedPoint = { latitude: number; longitude: number };
type Cache = Record<string, CachedPoint>;
type NominatimResult = { lat: string; lon: string };

function readCache(): Cache {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? '{}');
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Cache : {};
  } catch {
    return {};
  }
}

function saveCache(cache: Cache) {
  try {
    const entries = Object.entries(cache).slice(-100);
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // The map still works without persistent caching.
  }
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase('ru-RU').replace(/\s+/g, ' ');
}

async function geocode(query: string, signal: AbortSignal): Promise<CachedPoint | null> {
  const params = new URLSearchParams({ q: query, format: 'jsonv2', limit: '1', 'accept-language': 'ru' });
  const response = await fetch(`${NOMINATIM_URL}/search?${params}`, { signal });
  if (!response.ok) return null;
  const [result] = await response.json() as NominatimResult[];
  const latitude = Number(result?.lat);
  const longitude = Number(result?.lon);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
}

function activityCandidates(plan: TripPlan) {
  const seen = new Set<string>();
  return plan.days.flatMap((day) => day.activities.map((activity) => ({
    id: `${day.day}-${activity.time}-${activity.place}`,
    label: activity.place || activity.title,
    context: `День ${day.day} · ${activity.time}`,
    query: [activity.place || activity.title, activity.area, plan.destination.city, plan.destination.country].filter(Boolean).join(', '),
  }))).filter((item) => {
    const key = normalize(item.query);
    if (item.label.length < 2 || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, MAX_ACTIVITY_POINTS);
}

export async function loadTripMapData(
  plan: TripPlan,
  signal: AbortSignal,
  onProgress: (completed: number, total: number) => void,
): Promise<{ center: TripLocation | null; points: TripMapPoint[] }> {
  const candidates = activityCandidates(plan);
  const center = await findTripLocation(plan.destination.city, plan.destination.country, signal).catch(() => null);
  const cache = readCache();
  const points: TripMapPoint[] = [];
  let lastRequestAt = 0;

  for (let index = 0; index < candidates.length; index += 1) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    const candidate = candidates[index];
    const cacheKey = normalize(candidate.query);
    let coordinates: CachedPoint | undefined = cache[cacheKey];
    if (!coordinates) {
      const wait = Math.max(0, 1_100 - (Date.now() - lastRequestAt));
      if (wait) await new Promise((resolve) => window.setTimeout(resolve, wait));
      coordinates = await geocode(candidate.query, signal) ?? undefined;
      lastRequestAt = Date.now();
      if (coordinates) { cache[cacheKey] = coordinates; saveCache(cache); }
    }
    if (coordinates) points.push({ ...candidate, ...coordinates });
    onProgress(index + 1, candidates.length);
  }
  return { center, points };
}
