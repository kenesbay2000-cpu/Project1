import type { TripMapPoint } from './tripMapGeocoding';

const ROUTING_URL = import.meta.env?.VITE_ROUTING_URL?.trim() || 'https://routing.openstreetmap.de/routed-foot';
const REQUEST_INTERVAL_MS = 1_100;
const REQUEST_TIMEOUT_MS = 15_000;
const CACHE_KEY = 'roamly.trip-routes.v1';

export type TripDayRoute = {
  day: number;
  coordinates: Array<[number, number]>;
  distanceMeters: number;
  durationSeconds: number;
};

type RouteCache = Record<string, Omit<TripDayRoute, 'day'>>;
type OsrmResponse = {
  code?: string;
  routes?: Array<{
    distance?: number;
    duration?: number;
    geometry?: { coordinates?: unknown[] };
  }>;
};

function routeCacheKey(points: TripMapPoint[]) {
  return points.map((point) => `${point.latitude.toFixed(5)},${point.longitude.toFixed(5)}`).join(';');
}

function readCache(): RouteCache {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? '{}');
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as RouteCache : {};
  } catch { return {}; }
}

function saveCache(cache: RouteCache) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(Object.entries(cache).slice(-80))));
  } catch {
    // Routing remains available when browser storage is disabled.
  }
}

function validGeometry(value: unknown): Array<[number, number]> | null {
  if (!Array.isArray(value)) return null;
  const coordinates = value.flatMap((item) => {
    if (!Array.isArray(item) || item.length < 2) return [];
    const longitude = Number(item[0]);
    const latitude = Number(item[1]);
    return Number.isFinite(latitude) && Number.isFinite(longitude)
      ? [[latitude, longitude] as [number, number]] : [];
  });
  return coordinates.length > 1 ? coordinates : null;
}

async function requestDayRoute(day: number, points: TripMapPoint[], signal: AbortSignal) {
  const coordinates = points.map((point) => `${point.longitude},${point.latitude}`).join(';');
  const params = new URLSearchParams({ overview: 'full', geometries: 'geojson', steps: 'false' });
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timeout = globalThis.setTimeout(abort, REQUEST_TIMEOUT_MS);
  signal.addEventListener('abort', abort, { once: true });
  let data: OsrmResponse;
  try {
    const response = await fetch(`${ROUTING_URL}/route/v1/driving/${coordinates}?${params}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`Routing HTTP ${response.status}`);
    data = await response.json() as OsrmResponse;
  } catch (error) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    if (controller.signal.aborted) throw new Error('Routing request timed out.');
    throw error;
  } finally {
    globalThis.clearTimeout(timeout);
    signal.removeEventListener('abort', abort);
  }
  const route = data.routes?.[0];
  const geometry = validGeometry(route?.geometry?.coordinates);
  if (data.code !== 'Ok' || !route || !geometry || !Number.isFinite(route.distance) || !Number.isFinite(route.duration)) {
    throw new Error('Routing service returned an incomplete route.');
  }
  return { day, coordinates: geometry, distanceMeters: Number(route.distance), durationSeconds: Number(route.duration) };
}

function pointsByDay(points: TripMapPoint[]) {
  const groups = new Map<number, TripMapPoint[]>();
  points.forEach((point) => groups.set(point.day, [...(groups.get(point.day) ?? []), point]));
  return [...groups.entries()].map(([day, items]) => ({ day, points: items.sort((a, b) => a.order - b.order) }))
    .filter((group) => group.points.length > 1);
}

export async function loadTripRoutes(
  points: TripMapPoint[], signal: AbortSignal,
  onProgress?: (completed: number, total: number) => void,
) {
  const groups = pointsByDay(points);
  const cache = readCache();
  const routes: TripDayRoute[] = [];
  let lastRequestAt = 0;
  let completed = 0;
  for (const group of groups) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    const key = routeCacheKey(group.points);
    const cached = cache[key];
    if (cached) routes.push({ day: group.day, ...cached });
    else {
      const wait = Math.max(0, REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt));
      if (wait) await new Promise((resolve) => globalThis.setTimeout(resolve, wait));
      try {
        const route = await requestDayRoute(group.day, group.points, signal);
        routes.push(route);
        cache[key] = { coordinates: route.coordinates, distanceMeters: route.distanceMeters, durationSeconds: route.durationSeconds };
        saveCache(cache);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') throw error;
      } finally { lastRequestAt = Date.now(); }
    }
    completed += 1;
    onProgress?.(completed, groups.length);
  }
  return routes;
}

export function summarizeTripRoutes(routes: TripDayRoute[], selectedDay: number | null) {
  const visible = selectedDay === null ? routes : routes.filter((route) => route.day === selectedDay);
  return visible.reduce((summary, route) => ({
    distanceMeters: summary.distanceMeters + route.distanceMeters,
    durationSeconds: summary.durationSeconds + route.durationSeconds,
  }), { distanceMeters: 0, durationSeconds: 0 });
}
