export type PlaceKind = 'accommodations' | 'food' | 'activities';

export type PlaceCandidate = {
  name: string;
  area: string;
  address: string;
  category: string;
  latitude: number;
  longitude: number;
  website?: string;
};

type CacheEntry = { expiresAt: number; places: PlaceCandidate[]; provider: string };
const cache = new Map<string, CacheEntry>();
const CACHE_MS = 30 * 60 * 1_000;
const GEOAPIFY_URL = 'https://api.geoapify.com';
const OVERPASS_URL = Deno.env.get('OVERPASS_URL')?.trim() || 'https://overpass-api.de/api/interpreter';

const geoCategories: Record<PlaceKind, string> = {
  accommodations: 'accommodation',
  food: 'catering.restaurant,catering.cafe',
  activities: 'tourism,entertainment,leisure.park,heritage,natural',
};

const overpassFilters: Record<PlaceKind, string> = {
  accommodations: '["tourism"~"hotel|hostel|guest_house|motel|apartment|chalet"]',
  food: '["amenity"~"restaurant|cafe|fast_food|food_court"]',
  activities: '["tourism"~"attraction|museum|gallery|viewpoint|theme_park|zoo|aquarium"]',
};
const overpassRadius: Record<PlaceKind, number> = { accommodations: 10_000, food: 5_000, activities: 12_000 };

async function requestJson(url: string, timeoutMs = 12_000, headers?: HeadersInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, headers });
    if (!response.ok) throw new Error(`Travel data HTTP ${response.status}`);
    return await response.json() as unknown;
  } finally { clearTimeout(timeout); }
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function number(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function uniquePlaces(places: PlaceCandidate[]) {
  const names = new Set<string>();
  return places.filter((place) => {
    const key = place.name.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
    if (key.length < 2 || names.has(key)) return false;
    names.add(key);
    return true;
  }).slice(0, 40);
}

async function geoapifyPlaces(city: string, country: string, kind: PlaceKind, apiKey: string) {
  const query = encodeURIComponent(`${city}, ${country}`);
  const geocode = record(await requestJson(`${GEOAPIFY_URL}/v1/geocode/search?text=${query}&format=json&limit=1&apiKey=${encodeURIComponent(apiKey)}`));
  const location = Array.isArray(geocode?.results) ? record(geocode.results[0]) : null;
  const latitude = number(location?.lat);
  const longitude = number(location?.lon);
  if (latitude === null || longitude === null) return [];
  const params = new URLSearchParams({
    categories: geoCategories[kind], filter: `circle:${longitude},${latitude},20000`,
    bias: `proximity:${longitude},${latitude}`, limit: '40', apiKey,
  });
  const response = record(await requestJson(`${GEOAPIFY_URL}/v2/places?${params}`));
  const features = Array.isArray(response?.features) ? response.features : [];
  return uniquePlaces(features.flatMap((feature) => {
    const properties = record(record(feature)?.properties);
    const lat = number(properties?.lat);
    const lon = number(properties?.lon);
    const name = typeof properties?.name === 'string' ? properties.name.trim() : '';
    if (!name || lat === null || lon === null) return [];
    const categories = Array.isArray(properties?.categories) ? properties.categories.filter((item) => typeof item === 'string') : [];
    return [{ name, latitude: lat, longitude: lon,
      area: String(properties?.suburb ?? properties?.district ?? properties?.city ?? city),
      address: String(properties?.formatted ?? properties?.address_line2 ?? ''),
      category: String(categories[0] ?? kind), website: typeof properties?.website === 'string' ? properties.website : undefined }];
  }));
}

async function openMeteoLocation(city: string, country: string) {
  const params = new URLSearchParams({ name: city, count: '8', language: 'en', format: 'json' });
  const response = record(await requestJson(`https://geocoding-api.open-meteo.com/v1/search?${params}`));
  const results = Array.isArray(response?.results) ? response.results.map(record).filter(Boolean) as Record<string, unknown>[] : [];
  const countryKey = country.toLocaleLowerCase();
  const location = results.find((item) => String(item.country ?? '').toLocaleLowerCase().includes(countryKey)) ?? results[0];
  return location ? { latitude: number(location.latitude), longitude: number(location.longitude) } : null;
}

async function overpassPlaces(city: string, country: string, kind: PlaceKind) {
  const location = await openMeteoLocation(city, country);
  if (location?.latitude === null || location?.longitude === null || !location) return [];
  const query = `[out:json][timeout:12];nwr(around:${overpassRadius[kind]},${location.latitude},${location.longitude})${overpassFilters[kind]}["name"];out center 45;`;
  const response = record(await requestJson(`${OVERPASS_URL}?data=${encodeURIComponent(query)}`, 15_000, {
    Accept: 'application/json', 'User-Agent': 'Roamly travel planner (github.com/kenesbay2000-cpu/Project1)',
  }));
  const elements = Array.isArray(response?.elements) ? response.elements : [];
  return uniquePlaces(elements.flatMap((element) => {
    const item = record(element);
    const tags = record(item?.tags);
    const center = record(item?.center);
    const latitude = number(item?.lat ?? center?.lat);
    const longitude = number(item?.lon ?? center?.lon);
    const name = typeof tags?.name === 'string' ? tags.name.trim() : '';
    if (!name || latitude === null || longitude === null) return [];
    return [{ name, latitude, longitude, area: String(tags?.['addr:suburb'] ?? tags?.['addr:district'] ?? city),
      address: [tags?.['addr:street'], tags?.['addr:housenumber']].filter(Boolean).join(' '),
      category: String(tags?.tourism ?? tags?.amenity ?? tags?.leisure ?? kind),
      website: typeof tags?.website === 'string' ? tags.website : undefined }];
  }));
}

export async function loadPlaceCandidates(city: string, country: string, kind: PlaceKind) {
  const key = `${city}|${country}|${kind}`.toLocaleLowerCase();
  const saved = cache.get(key);
  if (saved && saved.expiresAt > Date.now()) return saved;
  const apiKey = Deno.env.get('GEOAPIFY_API_KEY')?.trim();
  let places: PlaceCandidate[] = [];
  let provider = 'OpenStreetMap';
  try { if (apiKey) { places = await geoapifyPlaces(city, country, kind, apiKey); provider = 'Geoapify'; } } catch { /* Try OSM fallback. */ }
  if (places.length < 6) {
    try { places = await overpassPlaces(city, country, kind); provider = 'OpenStreetMap'; } catch { /* Caller handles an empty result. */ }
  }
  const result = { places, provider, expiresAt: Date.now() + (places.length >= 6 ? CACHE_MS : 15_000) };
  console.info(`[TravelData] ${kind} for ${city}: ${places.length} candidates from ${provider}.`);
  cache.set(key, result);
  return result;
}
