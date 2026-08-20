import { loadPlaceGrounding } from './travelDataGrounding.ts';
import type { PlaceCandidate, PlaceKind } from './travelPlaceData.ts';
import { clusterPlacesByCoordinates, type GeographicPlaceCluster } from './geographicClustering.ts';

export type GroundingDestination = {
  city: string;
  country: string;
  clusterIndex?: number;
  clusterCount?: number;
};
export type MultiCityGrounding = {
  prompt: string;
  names: Set<string>;
  places: PlaceCandidate[];
  missingCities: string[];
  elapsedMs: number;
  clusters: GeographicPlaceCluster[];
};

function key(place: PlaceCandidate) {
  return `${place.name}|${place.latitude.toFixed(5)}|${place.longitude.toFixed(5)}`.toLocaleLowerCase();
}

function pause(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function clusterPrompt(destination: GroundingDestination, cluster: GeographicPlaceCluster, provider: string) {
  const places = cluster.places.map(({ photo, ...place }) => ({ ...place, photoAvailable: Boolean(photo) }));
  const position = `${cluster.latitude.toFixed(5)}, ${cluster.longitude.toFixed(5)}`;
  return `ГЕОГРАФИЧЕСКИЙ КЛАСТЕР: ${destination.city} · ${cluster.label} (центр ${position})\n`
    + `ПРОВЕРЕННЫЕ МЕСТА ИЗ ${provider.toUpperCase()} API:\n${JSON.stringify(places)}\n`
    + 'Используй только точные name из этого кластера. Не смешивай его с удалёнными городами или районами.';
}

export async function loadMultiCityGrounding(destinations: GroundingDestination[], kind: PlaceKind, totalLimit = 48): Promise<MultiCityGrounding> {
  const started = Date.now();
  const prompts: string[] = [];
  const names = new Set<string>();
  const places = new Map<string, PlaceCandidate>();
  const missingCities: string[] = [];
  const clusters: GeographicPlaceCluster[] = [];
  const perCityLimit = Math.max(8, Math.floor(totalLimit / Math.max(1, destinations.length)));
  for (let index = 0; index < destinations.length; index += 1) {
    const destination = destinations[index];
    const grounding = await loadPlaceGrounding(destination.city, destination.country, kind, 0, perCityLimit);
    if (grounding.places.length === 0) missingCities.push(destination.city);
    else {
      const requestedCount = Math.max(1, Math.min(4, destination.clusterCount ?? 1));
      const cityClusters = clusterPlacesByCoordinates(grounding.places, destination.city, requestedCount);
      const selected = destination.clusterIndex === undefined
        ? cityClusters
        : [cityClusters[Math.min(destination.clusterIndex, cityClusters.length - 1)]];
      selected.filter(Boolean).forEach((cluster) => {
        clusters.push(cluster);
        prompts.push(clusterPrompt(destination, cluster, grounding.provider));
        cluster.places.forEach((place) => {
          names.add(place.name.normalize('NFKD').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ''));
          places.set(key(place), place);
        });
      });
    }
    if (index < destinations.length - 1) await pause(180);
  }
  const value = { prompt: prompts.join('\n'), names, places: [...places.values()].slice(0, totalLimit), missingCities,
    elapsedMs: Date.now() - started, clusters };
  console.info(`[TravelData] ${kind} clusters: ${clusters.length} across ${destinations.length - missingCities.length}/${destinations.length} cities, ${value.places.length} candidates, ${value.elapsedMs} ms.`);
  return value;
}
