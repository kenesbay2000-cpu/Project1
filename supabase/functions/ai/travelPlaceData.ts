import {
  categoryList, diversifyPlaces, finiteNumber, priceHint, record, specificCategory, textValue,
} from './travelPlaceCandidates.ts';

export type PlaceKind = 'accommodations' | 'food' | 'activities';

export type PlaceCandidate = {
  name: string;
  area: string;
  address: string;
  category: string;
  categories: string[];
  latitude: number;
  longitude: number;
  website?: string;
  stars?: number;
  rating?: number;
  priceHint?: string;
};

type CacheEntry = { expiresAt: number; places: PlaceCandidate[]; provider: string };
const cache = new Map<string, CacheEntry>();
const CACHE_MS = 2 * 60 * 60 * 1_000;
const LOCATION_CACHE_MS = 24 * 60 * 60 * 1_000;
const locationCache = new Map<string, { expiresAt: number; latitude: number; longitude: number }>();
const GEOAPIFY_URL = 'https://api.geoapify.com';
const OVERPASS_URL = Deno.env.get('OVERPASS_URL')?.trim() || 'https://overpass-api.de/api/interpreter';

const geoCategories: Record<PlaceKind, string> = {
  accommodations: 'accommodation',
  food: 'catering.restaurant,catering.cafe,catering.fast_food,catering.food_court',
  activities: 'tourism,entertainment,activity,leisure.park,heritage,natural',
};
const geoRadius: Record<PlaceKind, number> = { accommodations: 25_000, food: 20_000, activities: 40_000 };

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

async function geoapifyLocation(city: string, country: string, apiKey: string) {
  const key = `${city}|${country}`.toLocaleLowerCase();
  const saved = locationCache.get(key);
  if (saved && saved.expiresAt > Date.now()) return saved;
  const query = encodeURIComponent(`${city}, ${country}`);
  const geocode = record(await requestJson(`${GEOAPIFY_URL}/v1/geocode/search?text=${query}&format=json&limit=1&apiKey=${encodeURIComponent(apiKey)}`));
  const location = Array.isArray(geocode?.results) ? record(geocode.results[0]) : null;
  const latitude = finiteNumber(location?.lat);
  const longitude = finiteNumber(location?.lon);
  if (latitude === null || longitude === null) return null;
  const result = { latitude, longitude, expiresAt: Date.now() + LOCATION_CACHE_MS };
  locationCache.set(key, result);
  return result;
}

async function geoapifyPlaces(city: string, country: string, kind: PlaceKind, apiKey: string) {
  const location = await geoapifyLocation(city, country, apiKey);
  if (!location) return [];
  const { latitude, longitude } = location;
  const params = new URLSearchParams({
    categories: geoCategories[kind], filter: `circle:${longitude},${latitude},${geoRadius[kind]}`,
    bias: `proximity:${longitude},${latitude}`, limit: '80', apiKey,
  });
  const response = record(await requestJson(`${GEOAPIFY_URL}/v2/places?${params}`));
  const features = Array.isArray(response?.features) ? response.features : [];
  return diversifyPlaces(features.flatMap((feature) => {
    const properties = record(record(feature)?.properties);
    const lat = finiteNumber(properties?.lat);
    const lon = finiteNumber(properties?.lon);
    const name = typeof properties?.name === 'string' ? properties.name.trim() : '';
    if (!name || lat === null || lon === null) return [];
    const categories = categoryList(properties?.categories);
    const raw = record(record(properties?.datasource)?.raw);
    return [{ name, latitude: lat, longitude: lon,
      area: String(properties?.suburb ?? properties?.district ?? properties?.city ?? city),
      address: String(properties?.formatted ?? properties?.address_line2 ?? ''),
      categories, category: specificCategory(categories, kind), website: textValue(properties?.website),
      stars: finiteNumber(properties?.stars ?? raw?.stars) ?? undefined,
      rating: finiteNumber(properties?.rating ?? raw?.rating) ?? undefined,
      priceHint: priceHint(properties) ?? priceHint(raw) }];
  }));
}

async function openMeteoLocation(city: string, country: string) {
  const params = new URLSearchParams({ name: city, count: '8', language: 'en', format: 'json' });
  const response = record(await requestJson(`https://geocoding-api.open-meteo.com/v1/search?${params}`));
  const results = Array.isArray(response?.results) ? response.results.map(record).filter(Boolean) as Record<string, unknown>[] : [];
  const countryKey = country.toLocaleLowerCase();
  const location = results.find((item) => String(item.country ?? '').toLocaleLowerCase().includes(countryKey)) ?? results[0];
  return location ? { latitude: finiteNumber(location.latitude), longitude: finiteNumber(location.longitude) } : null;
}

async function overpassPlaces(city: string, country: string, kind: PlaceKind) {
  const location = await openMeteoLocation(city, country);
  if (location?.latitude === null || location?.longitude === null || !location) return [];
  const query = `[out:json][timeout:12];nwr(around:${overpassRadius[kind]},${location.latitude},${location.longitude})${overpassFilters[kind]}["name"];out center 45;`;
  const response = record(await requestJson(`${OVERPASS_URL}?data=${encodeURIComponent(query)}`, 15_000, {
    Accept: 'application/json', 'User-Agent': 'Roamly travel planner (github.com/kenesbay2000-cpu/Project1)',
  }));
  const elements = Array.isArray(response?.elements) ? response.elements : [];
  return diversifyPlaces(elements.flatMap((element) => {
    const item = record(element);
    const tags = record(item?.tags);
    const center = record(item?.center);
    const latitude = finiteNumber(item?.lat ?? center?.lat);
    const longitude = finiteNumber(item?.lon ?? center?.lon);
    const name = typeof tags?.name === 'string' ? tags.name.trim() : '';
    if (!name || latitude === null || longitude === null) return [];
    const category = String(tags?.tourism ?? tags?.amenity ?? tags?.leisure ?? kind);
    return [{ name, latitude, longitude, area: String(tags?.['addr:suburb'] ?? tags?.['addr:district'] ?? city),
      address: [tags?.['addr:street'], tags?.['addr:housenumber']].filter(Boolean).join(' '),
      categories: [category], category, website: textValue(tags?.website),
      stars: finiteNumber(tags?.stars) ?? undefined, priceHint: priceHint(tags) }];
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
    try {
      const geoapifyCount = places.length;
      const fallback = await overpassPlaces(city, country, kind);
      places = diversifyPlaces([...places, ...fallback]);
      provider = geoapifyCount > 0 ? 'Geoapify + OpenStreetMap' : 'OpenStreetMap';
    } catch { /* Caller handles a short result without inventing places. */ }
  }
  places = diversifyPlaces(places);
  const result = { places, provider, expiresAt: Date.now() + (places.length >= 6 ? CACHE_MS : 15_000) };
  console.info(`[TravelData] ${kind} for ${city}: ${places.length} candidates from ${provider}.`);
  cache.set(key, result);
  return result;
}
