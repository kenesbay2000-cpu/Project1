import type { PlaceCandidate } from './travelPlaceData.ts';

export type GeographicPlaceCluster = {
  label: string;
  latitude: number;
  longitude: number;
  places: PlaceCandidate[];
};

const MIN_PLACES_PER_CLUSTER = 6;
const MIN_CLUSTERING_SPAN_KM = 2.5;

function distanceKm(first: Pick<PlaceCandidate, 'latitude' | 'longitude'>, second: Pick<PlaceCandidate, 'latitude' | 'longitude'>) {
  const latitudeKm = (first.latitude - second.latitude) * 111.32;
  const meanLatitude = (first.latitude + second.latitude) * Math.PI / 360;
  const longitudeKm = (first.longitude - second.longitude) * 111.32 * Math.cos(meanLatitude);
  return Math.hypot(latitudeKm, longitudeKm);
}

function centroid(places: PlaceCandidate[]) {
  return {
    latitude: places.reduce((sum, place) => sum + place.latitude, 0) / places.length,
    longitude: places.reduce((sum, place) => sum + place.longitude, 0) / places.length,
  };
}

function dominantArea(places: PlaceCandidate[], fallback: string) {
  const counts = new Map<string, number>();
  for (const place of places) {
    const area = place.area.trim();
    if (area) counts.set(area, (counts.get(area) ?? 0) + 1);
  }
  return [...counts.entries()].sort((first, second) => second[1] - first[1])[0]?.[0] ?? fallback;
}

function initialCenters(places: PlaceCandidate[], count: number) {
  const center = centroid(places);
  const centers = [places.reduce((best, place) => distanceKm(place, center) < distanceKm(best, center) ? place : best)];
  while (centers.length < count) {
    const next = places.reduce((best, place) => {
      const nearest = Math.min(...centers.map((item) => distanceKm(place, item)));
      const bestNearest = Math.min(...centers.map((item) => distanceKm(best, item)));
      return nearest > bestNearest ? place : best;
    });
    centers.push(next);
  }
  return centers.map((place) => ({ latitude: place.latitude, longitude: place.longitude }));
}

function kMeans(places: PlaceCandidate[], count: number) {
  let centers = initialCenters(places, count);
  let groups: PlaceCandidate[][] = [];
  for (let iteration = 0; iteration < 8; iteration += 1) {
    groups = Array.from({ length: count }, () => []);
    for (const place of places) {
      const distances = centers.map((center) => distanceKm(place, center));
      groups[distances.indexOf(Math.min(...distances))].push(place);
    }
    centers = groups.map((group, index) => group.length ? centroid(group) : centers[index]);
  }
  return groups.filter((group) => group.length > 0);
}

function mergeSmallGroups(groups: PlaceCandidate[][]) {
  const stable = groups.filter((group) => group.length >= MIN_PLACES_PER_CLUSTER);
  const small = groups.filter((group) => group.length < MIN_PLACES_PER_CLUSTER);
  if (stable.length === 0) return [groups.flat()];
  for (const group of small) {
    const groupCenter = centroid(group);
    const nearest = stable.reduce((best, candidate) => (
      distanceKm(groupCenter, centroid(candidate)) < distanceKm(groupCenter, centroid(best)) ? candidate : best
    ));
    nearest.push(...group);
  }
  return stable;
}

function routeOrder(groups: PlaceCandidate[][]) {
  const remaining = groups.map((places) => ({ places, center: centroid(places) }));
  const cityCenter = centroid(groups.flat());
  const ordered = [remaining.splice(remaining.findIndex((group) => (
    distanceKm(group.center, cityCenter) === Math.min(...remaining.map((item) => distanceKm(item.center, cityCenter)))
  )), 1)[0]];
  while (remaining.length > 0) {
    const previous = ordered[ordered.length - 1].center;
    const nearestIndex = remaining.findIndex((group) => (
      distanceKm(group.center, previous) === Math.min(...remaining.map((item) => distanceKm(item.center, previous)))
    ));
    ordered.push(remaining.splice(nearestIndex, 1)[0]);
  }
  return ordered;
}

export function clusterPlacesByCoordinates(places: PlaceCandidate[], city: string, requestedCount: number) {
  if (places.length === 0) return [];
  const span = Math.max(...places.map((first) => Math.max(...places.map((second) => distanceKm(first, second)))));
  const count = span < MIN_CLUSTERING_SPAN_KM
    ? 1
    : Math.max(1, Math.min(requestedCount, Math.floor(places.length / MIN_PLACES_PER_CLUSTER)));
  const groups = count === 1 ? [places] : mergeSmallGroups(kMeans(places, count));
  return routeOrder(groups).map(({ places: clusterPlaces, center }) => ({
    label: dominantArea(clusterPlaces, city),
    latitude: center.latitude,
    longitude: center.longitude,
    places: clusterPlaces,
  } satisfies GeographicPlaceCluster));
}
