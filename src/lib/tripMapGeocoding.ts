import type { TripPlan } from './aiPlanner';
import {
  logTripMapCandidates, logTripMapItem, logTripMapSummary,
  type TripMapDiagnosticItem, type TripMapDiagnosticSummary,
} from './tripMapDiagnostics';
import {
  geocodeMapQuery, normalizeMapQuery, readGeocodingCache, saveGeocodingCache,
  storedActivityCoordinates, type Coordinates,
} from './tripMapGeocoder';
import { findTripLocation, type TripLocation } from './tripLocation';

export type TripMapPoint = {
  id: string;
  day: number;
  order: number;
  time: string;
  title: string;
  place: string;
  description: string;
  accuracy: 'exact' | 'area';
  latitude: number;
  longitude: number;
};

type Candidate = Omit<TripMapPoint, 'latitude' | 'longitude' | 'accuracy'> & {
  exactQuery: string;
  areaQuery: string;
  coordinates?: Coordinates;
};

function countryName(value: string) {
  const parts = value.split(',').map((part) => part.trim()).filter(Boolean);
  return parts[parts.length - 1] ?? value;
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
    exactQuery: [activity.place || activity.title, activity.area, plan.destination.city, countryName(plan.destination.country)]
      .filter(Boolean).join(', '),
    areaQuery: [activity.area, plan.destination.city, countryName(plan.destination.country)].filter(Boolean).join(', '),
    coordinates: storedActivityCoordinates(activity),
  }))).filter((item) => item.place.trim().length >= 2);
}

type ResolvedPoint = Coordinates & { accuracy: 'exact' | 'area' };

function resolvedPoints(candidates: Candidate[], resolved: Map<string, ResolvedPoint>) {
  return candidates.flatMap(({ exactQuery: _exact, areaQuery: _area, coordinates, ...candidate }) => {
    const point = coordinates ? { ...coordinates, accuracy: 'exact' as const } : resolved.get(candidate.id);
    return point ? [{ ...candidate, ...point }] : [];
  });
}

function buildSummary(candidates: Candidate[], items: TripMapDiagnosticItem[], points: TripMapPoint[]): TripMapDiagnosticSummary {
  return {
    activities: candidates.length,
    stored: items.filter((item) => item.status === 'stored').length,
    cached: items.filter((item) => item.status === 'cached').length,
    requested: items.filter((item) => ['success', 'empty', 'error'].includes(item.status)).length,
    successful: items.filter((item) => item.status === 'success').length,
    empty: items.filter((item) => item.status === 'empty').length,
    errors: items.filter((item) => item.status === 'error').length,
    renderablePoints: points.length,
    approximatePoints: points.filter((point) => point.accuracy === 'area').length,
  };
}

export async function loadTripMapData(
  plan: TripPlan,
  signal: AbortSignal,
  onProgress: (completed: number, total: number, points: TripMapPoint[]) => void,
): Promise<{ center: TripLocation | null; points: TripMapPoint[]; diagnostics: TripMapDiagnosticSummary }> {
  const candidates = activityCandidates(plan);
  logTripMapCandidates(candidates.map((candidate) => ({ ...candidate, query: candidate.exactQuery })));
  const center = await findTripLocation(plan.destination.city, plan.destination.country, signal).catch(() => null);
  const cache = readGeocodingCache();
  const resolved = new Map<string, ResolvedPoint>();
  const items: TripMapDiagnosticItem[] = [];
  const unresolved: Candidate[] = [];

  candidates.forEach((candidate) => {
    if (candidate.coordinates) {
      items.push({ query: candidate.exactQuery, stage: 'stored', status: 'stored', coordinates: candidate.coordinates });
      return;
    }
    const key = normalizeMapQuery(candidate.exactQuery);
    if (cache[key]) {
      resolved.set(candidate.id, { ...cache[key], accuracy: 'exact' });
      items.push({ query: candidate.exactQuery, stage: 'exact', status: 'cached', coordinates: cache[key] });
    } else unresolved.push(candidate);
  });
  onProgress(0, unresolved.length, resolvedPoints(candidates, resolved));

  let completed = 0;
  let lastRequestAt = 0;
  for (const candidate of unresolved) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    const queries = [
      { query: candidate.exactQuery, stage: 'exact' as const },
      { query: candidate.areaQuery, stage: 'area' as const },
    ].filter((entry, index, all) => entry.query && all.findIndex((item) => normalizeMapQuery(item.query) === normalizeMapQuery(entry.query)) === index);
    for (const entry of queries) {
      const key = normalizeMapQuery(entry.query);
      const cached = cache[key];
      if (cached) {
        resolved.set(candidate.id, { ...cached, accuracy: entry.stage });
        items.push({ ...entry, status: 'cached', coordinates: cached });
        break;
      }
      const wait = Math.max(0, 1_100 - (Date.now() - lastRequestAt));
      if (wait) await new Promise((resolve) => window.setTimeout(resolve, wait));
      const result = await geocodeMapQuery(entry.query, signal);
      lastRequestAt = Date.now();
      const item: TripMapDiagnosticItem = result.status === 'success'
        ? { ...entry, status: 'success', coordinates: result.coordinates }
        : result.status === 'error' ? { ...entry, status: 'error', error: result.error } : { ...entry, status: 'empty' };
      items.push(item);
      logTripMapItem(item);
      if (result.status === 'success') {
        resolved.set(candidate.id, { ...result.coordinates, accuracy: entry.stage });
        cache[key] = result.coordinates;
        saveGeocodingCache(cache);
        break;
      }
    }
    completed += 1;
    onProgress(completed, unresolved.length, resolvedPoints(candidates, resolved));
  }

  const points = resolvedPoints(candidates, resolved);
  const diagnostics = buildSummary(candidates, items, points);
  logTripMapSummary(diagnostics, items);
  return { center, points, diagnostics };
}
