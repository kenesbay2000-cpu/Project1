import type { PlaceCandidate } from './travelPlaceData.ts';

export type VerifiedPlacePhoto = { url: string; sourceUrl?: string; credit: string };

export function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export function finiteNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function textValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function httpsUrl(value: unknown) {
  const candidate = textValue(value)?.split(';')[0]?.trim();
  if (!candidate) return undefined;
  try { return new URL(candidate).protocol === 'https:' ? candidate : undefined; }
  catch { return undefined; }
}

function mediaSource(media: Record<string, unknown> | null, imageUrl: string) {
  const commons = textValue(media?.wikimedia_commons);
  if (commons) {
    if (httpsUrl(commons)) return commons;
    return `https://commons.wikimedia.org/wiki/${encodeURIComponent(commons.replace(/ /g, '_'))}`;
  }
  const wikipedia = textValue(media?.wikipedia);
  if (wikipedia) {
    if (httpsUrl(wikipedia)) return wikipedia;
    const match = /^([a-z-]{2,12}):(.+)$/i.exec(wikipedia);
    if (match) return `https://${match[1]}.wikipedia.org/wiki/${encodeURIComponent(match[2].replace(/ /g, '_'))}`;
  }
  return imageUrl;
}

export function geoapifyPhoto(properties: Record<string, unknown>) {
  const media = record(properties.wiki_and_media);
  const url = httpsUrl(media?.image);
  return url ? { url, sourceUrl: mediaSource(media, url), credit: 'Geoapify Places' } satisfies VerifiedPlacePhoto : undefined;
}

export function priceHint(source: Record<string, unknown> | null) {
  const keys = ['price_level', 'price_range', 'price', 'cost', 'fee', 'charge'];
  for (const key of keys) {
    const value = source?.[key];
    if ((typeof value === 'string' || typeof value === 'number') && String(value).trim()) {
      return String(value).trim().slice(0, 80);
    }
  }
  return undefined;
}

export function categoryList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : [];
}

export function specificCategory(categories: string[], fallback: string) {
  return categories.reduce((best, item) => (
    item.split('.').length > best.split('.').length ? item : best
  ), categories[0] ?? fallback);
}

function normalizedName(value: string) {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
}

export function diversifyPlaces(places: PlaceCandidate[], limit = 80) {
  const names = new Set<string>();
  const buckets = new Map<string, PlaceCandidate[]>();
  for (const place of places) {
    const name = normalizedName(place.name);
    if (name.length < 2 || names.has(name)) continue;
    names.add(name);
    const key = `${place.category}|${place.area}`.toLocaleLowerCase();
    const bucket = buckets.get(key) ?? [];
    bucket.push(place);
    buckets.set(key, bucket);
  }

  const result: PlaceCandidate[] = [];
  const groups = [...buckets.values()];
  while (result.length < limit && groups.some((group) => group.length > 0)) {
    for (const group of groups) {
      const place = group.shift();
      if (place) result.push(place);
      if (result.length === limit) break;
    }
  }
  return result;
}
