import { requestNominatimJson } from './nominatimClient';
import { validCoordinates, type Coordinates } from './tripMapProvider';

type NominatimPhotoResult = {
  lat: string; lon: string; category?: string; type?: string; addresstype?: string;
  display_name?: string; namedetails?: Record<string, string>;
  extratags?: { wikidata?: string; wikimedia_commons?: string };
};
export type NominatimPhotoPlace = { wikidataId?: string; commonsFile?: string };
const ADMINISTRATIVE_TYPES = new Set(['city', 'country', 'county', 'municipality', 'neighbourhood', 'region', 'state', 'suburb', 'town', 'village']);

function normalizedName(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('en-US')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function placeNameMatches(queryName: string, result: NominatimPhotoResult) {
  const expected = normalizedName(queryName);
  const names = [result.display_name?.split(',')[0], ...Object.values(result.namedetails ?? {})]
    .filter((value): value is string => Boolean(value)).map(normalizedName);
  return expected.length >= 3 && names.some((name) => name === expected || (name.length >= 5 && expected.length >= 5
    && (name.includes(expected) || expected.includes(name))));
}

function searchBounds(center: Coordinates) {
  const latitudeDelta = 25 / 111;
  const longitudeDelta = 25 / (111 * Math.max(.2, Math.cos(center.latitude * Math.PI / 180)));
  return `${center.longitude - longitudeDelta},${center.latitude + latitudeDelta},${center.longitude + longitudeDelta},${center.latitude - latitudeDelta}`;
}

export async function searchNominatimPhotoPlace(placeName: string, query: string, center: Coordinates | null, signal: AbortSignal): Promise<NominatimPhotoPlace | null> {
  try {
    const params = new URLSearchParams({ q: query, format: 'jsonv2', limit: '5', addressdetails: '1', extratags: '1', namedetails: '1', dedupe: '1', 'accept-language': 'ru,en;q=0.8' });
    if (center) { params.set('viewbox', searchBounds(center)); params.set('bounded', '1'); }
    const results = await requestNominatimJson(`/search?${params}`, signal) as NominatimPhotoResult[];
    const match = results.find((result) => {
      const type = result.addresstype ?? result.type ?? '';
      const tags = result.extratags;
      return result.category !== 'boundary' && !(result.category === 'place' && ADMINISTRATIVE_TYPES.has(type))
        && Boolean(tags?.wikidata || tags?.wikimedia_commons?.startsWith('File:'))
        && Boolean(validCoordinates(result.lat, result.lon)) && placeNameMatches(placeName, result);
    });
    const commons = match?.extratags?.wikimedia_commons;
    return match ? { wikidataId: /^Q\d+$/.test(match.extratags?.wikidata ?? '') ? match.extratags?.wikidata : undefined,
      commonsFile: commons?.startsWith('File:') ? commons.slice(5) : undefined } : null;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    return null;
  }
}
