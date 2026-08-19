const NOMINATIM_URL = import.meta.env.VITE_NOMINATIM_URL?.trim() || 'https://nominatim.openstreetmap.org';
const PHOTON_URL = import.meta.env.VITE_PHOTON_URL?.trim() || 'https://photon.komoot.io';
const REQUEST_INTERVAL_MS = 1_100;
const SEARCH_RADIUS_KM = 25;

export type Coordinates = { latitude: number; longitude: number };
export type ProviderResult =
  | { status: 'success'; coordinates: Coordinates }
  | { status: 'empty' }
  | { status: 'error'; error: string };

type NominatimResult = {
  lat: string; lon: string; category?: string; type?: string; addresstype?: string;
};

type PhotonFeature = {
  geometry?: { coordinates?: unknown[] };
  properties?: { osm_key?: string; osm_value?: string; type?: string };
};

const ADMINISTRATIVE_TYPES = new Set([
  'city', 'country', 'county', 'municipality', 'neighbourhood', 'region', 'state',
  'suburb', 'town', 'village',
]);

let requestQueue: Promise<void> = Promise.resolve();
let lastRequestAt = 0;

export function validCoordinates(latitude: unknown, longitude: unknown): Coordinates | undefined {
  const lat = Number(latitude);
  const lon = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180
    ? { latitude: lat, longitude: lon } : undefined;
}

function delay(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    const timeout = globalThis.setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      globalThis.clearTimeout(timeout);
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });
}

function enqueueRequest<T>(signal: AbortSignal, request: () => Promise<T>) {
  const run = async () => {
    const wait = Math.max(0, REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt));
    if (wait) await delay(wait, signal);
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    try { return await request(); } finally { lastRequestAt = Date.now(); }
  };
  const result = requestQueue.then(run, run);
  requestQueue = result.then(() => undefined, () => undefined);
  return result;
}

function searchBounds(center: Coordinates) {
  const latitudeDelta = SEARCH_RADIUS_KM / 111;
  const longitudeDelta = SEARCH_RADIUS_KM / (111 * Math.max(.2, Math.cos(center.latitude * Math.PI / 180)));
  return {
    left: center.longitude - longitudeDelta, bottom: center.latitude - latitudeDelta,
    right: center.longitude + longitudeDelta, top: center.latitude + latitudeDelta,
  };
}

function distanceKm(from: Coordinates, to: Coordinates) {
  const radians = (value: number) => value * Math.PI / 180;
  const latitudeDistance = radians(to.latitude - from.latitude);
  const longitudeDistance = radians(to.longitude - from.longitude);
  const a = Math.sin(latitudeDistance / 2) ** 2
    + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(longitudeDistance / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function localCoordinates(latitude: unknown, longitude: unknown, center: Coordinates | null) {
  const coordinates = validCoordinates(latitude, longitude);
  return coordinates && (!center || distanceKm(center, coordinates) <= SEARCH_RADIUS_KM) ? coordinates : undefined;
}

async function requestJson(url: string, signal: AbortSignal) {
  const response = await enqueueRequest(signal, () => fetch(url, { signal }));
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
  return response.json() as Promise<unknown>;
}

export async function searchNominatim(query: string, center: Coordinates | null, signal: AbortSignal): Promise<ProviderResult> {
  try {
    const params = new URLSearchParams({
      q: query, format: 'jsonv2', limit: '5', addressdetails: '1', dedupe: '1',
      'accept-language': 'ru,en;q=0.8',
    });
    if (center) {
      const bounds = searchBounds(center);
      params.set('viewbox', `${bounds.left},${bounds.top},${bounds.right},${bounds.bottom}`);
      params.set('bounded', '1');
    }
    const results = await requestJson(`${NOMINATIM_URL}/search?${params}`, signal) as NominatimResult[];
    const coordinates = results.map((result) => {
      const type = result.addresstype ?? result.type ?? '';
      if (result.category === 'boundary' || (result.category === 'place' && ADMINISTRATIVE_TYPES.has(type))) return undefined;
      return localCoordinates(result.lat, result.lon, center);
    }).find(Boolean);
    return coordinates ? { status: 'success', coordinates } : { status: 'empty' };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    return { status: 'error', error: error instanceof Error ? error.message : 'Неизвестная сетевая ошибка.' };
  }
}

export async function searchPhoton(query: string, center: Coordinates, signal: AbortSignal): Promise<ProviderResult> {
  try {
    const bounds = searchBounds(center);
    const params = new URLSearchParams({
      q: query, limit: '5', bbox: `${bounds.left},${bounds.bottom},${bounds.right},${bounds.top}`,
      lat: String(center.latitude), lon: String(center.longitude), location_bias_scale: '0.05',
    });
    const data = await requestJson(`${PHOTON_URL}/api/?${params}`, signal) as { features?: PhotonFeature[] };
    const coordinates = (data.features ?? []).map((feature) => {
      const [longitude, latitude] = feature.geometry?.coordinates ?? [];
      const type = feature.properties?.osm_value ?? feature.properties?.type ?? '';
      if (feature.properties?.osm_key === 'place' && ADMINISTRATIVE_TYPES.has(type)) return undefined;
      return localCoordinates(latitude, longitude, center);
    }).find(Boolean);
    return coordinates ? { status: 'success', coordinates } : { status: 'empty' };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    return { status: 'error', error: error instanceof Error ? error.message : 'Неизвестная сетевая ошибка.' };
  }
}
