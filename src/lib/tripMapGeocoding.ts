import type { TripPlan } from './aiPlanner';
import {
  logTripMapCandidates, logTripMapItem, logTripMapSummary,
  type TripMapDiagnosticItem, type TripMapDiagnosticSummary,
} from './tripMapDiagnostics';
import {
  geocodeMapFallback, geocodeMapQuery, normalizeMapQuery, readGeocodingCache, saveGeocodingCache,
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
  cacheKey: string;
  queries: string[];
  coordinates?: Coordinates;
};

function countryName(value: string) {
  const parts = value.split(',').map((part) => part.trim()).filter(Boolean);
  return parts[parts.length - 1] ?? value;
}

function shorterPlaceName(value: string) {
  return value.replace(/\b(national park|market|pagoda|temple|hotel|restaurant|cafe|museum|mosque|cathedral)\b/giu, ' ')
    .replace(/\s+/g, ' ').trim();
}

export function buildTripMapQueries(place: string, area: string, city: string, country: string) {
  const shorterName = shorterPlaceName(place);
  const variants = [
    [place, city, country],
    [place, area, city, country],
    shorterName !== place ? [shorterName, city, country] : [],
    [place],
  ];
  return variants.map((parts) => parts.filter(Boolean).join(', ')).filter(Boolean)
    .filter((query, index, all) => all.findIndex((item) => normalizeMapQuery(item) === normalizeMapQuery(query)) === index);
}

function activityCandidates(plan: TripPlan): Candidate[] {
  const country = countryName(plan.destination.country);
  return plan.days.flatMap((day) => day.activities.map((activity, order) => {
    const place = activity.place || activity.title;
    const isMultiCity = /[,;\n/→]|\s+(?:и|and|then|затем)\s+/iu.test(plan.destination.city);
    const queryCity = isMultiCity && activity.area ? activity.area : plan.destination.city;
    const queries = buildTripMapQueries(place, activity.area, queryCity, country);
    return {
      id: `${day.day}-${order}-${activity.time}-${activity.place}`,
      day: day.day, order, time: activity.time, title: activity.title, place,
      description: activity.description, queries,
      cacheKey: normalizeMapQuery([place, queryCity, country].join(', ')),
      coordinates: storedActivityCoordinates(activity),
    };
  })).filter((item) => item.place.trim().length >= 2);
}

type ResolvedPoint = Coordinates & { accuracy: 'exact' | 'area' };

function resolvedPoints(candidates: Candidate[], resolved: Map<string, ResolvedPoint>) {
  return candidates.flatMap(({ cacheKey: _cacheKey, queries: _queries, coordinates, ...candidate }) => {
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
    approximatePoints: 0,
  };
}

export async function loadTripMapData(
  plan: TripPlan,
  signal: AbortSignal,
  onProgress: (completed: number, total: number, points: TripMapPoint[]) => void,
): Promise<{ center: TripLocation | null; points: TripMapPoint[]; diagnostics: TripMapDiagnosticSummary }> {
  const candidates = activityCandidates(plan);
  logTripMapCandidates(candidates.map((candidate) => ({ ...candidate, query: candidate.queries[0] })));
  const center = await findTripLocation(plan.destination.city, plan.destination.country, signal).catch(() => null);
  const cache = readGeocodingCache();
  const resolved = new Map<string, ResolvedPoint>();
  const items: TripMapDiagnosticItem[] = [];
  const unresolved: Candidate[] = [];

  candidates.forEach((candidate) => {
    if (candidate.coordinates) {
      items.push({ query: candidate.queries[0], stage: 'stored', status: 'stored', coordinates: candidate.coordinates });
    } else if (cache[candidate.cacheKey]) {
      resolved.set(candidate.id, { ...cache[candidate.cacheKey], accuracy: 'exact' });
      items.push({ query: candidate.queries[0], stage: 'exact', status: 'cached', coordinates: cache[candidate.cacheKey] });
    } else unresolved.push(candidate);
  });
  onProgress(0, unresolved.length, resolvedPoints(candidates, resolved));

  let completed = 0;
  for (const candidate of unresolved) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    for (const query of candidate.queries) {
      const entry = { query, stage: 'exact' as const };
      const result = await geocodeMapQuery(query, center, signal);
      const item: TripMapDiagnosticItem = result.status === 'success'
        ? { ...entry, status: 'success', coordinates: result.coordinates }
        : result.status === 'error' ? { ...entry, status: 'error', error: result.error } : { ...entry, status: 'empty' };
      items.push(item);
      logTripMapItem(item);
      if (result.status === 'success') {
        resolved.set(candidate.id, { ...result.coordinates, accuracy: 'exact' });
        cache[candidate.cacheKey] = result.coordinates;
        saveGeocodingCache(cache);
        break;
      }
      if (result.status === 'error') break;
    }
    if (!resolved.has(candidate.id)) {
      const result = await geocodeMapFallback(candidate.place, center, signal);
      const entry = { query: `[Photon] ${candidate.place}`, stage: 'exact' as const };
      const item: TripMapDiagnosticItem = result.status === 'success'
        ? { ...entry, status: 'success', coordinates: result.coordinates }
        : result.status === 'error' ? { ...entry, status: 'error', error: result.error } : { ...entry, status: 'empty' };
      items.push(item);
      logTripMapItem(item);
      if (result.status === 'success') {
        resolved.set(candidate.id, { ...result.coordinates, accuracy: 'exact' });
        cache[candidate.cacheKey] = result.coordinates;
        saveGeocodingCache(cache);
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
