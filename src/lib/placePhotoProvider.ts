import type { Coordinates } from './tripMapProvider';
import { searchNominatimPhotoPlace } from './nominatimPhotoProvider';
import type { RecommendationPhoto } from './placePhotoTypes';

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const METADATA_INTERVAL_MS = 250;
let metadataQueue: Promise<void> = Promise.resolve();
let lastMetadataRequestAt = 0;

type WikidataResponse = { entities?: Record<string, { claims?: { P18?: Array<{ rank?: string; mainsnak?: { datavalue?: { value?: unknown } } }> } }> };
type CommonsResponse = { query?: { pages?: Record<string, { imageinfo?: Array<{ thumburl?: string; url?: string; descriptionurl?: string; mime?: string; extmetadata?: Record<string, { value?: string }> }> }> } };

function delay(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    const timeout = globalThis.setTimeout(resolve, ms);
    signal.addEventListener('abort', () => { globalThis.clearTimeout(timeout); reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
  });
}

function queuedJson(url: string, signal: AbortSignal) {
  const run = async () => {
    const wait = Math.max(0, METADATA_INTERVAL_MS - (Date.now() - lastMetadataRequestAt));
    if (wait) await delay(wait, signal);
    try {
      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json() as unknown;
    } finally { lastMetadataRequestAt = Date.now(); }
  };
  const result = metadataQueue.then(run, run);
  metadataQueue = result.then(() => undefined, () => undefined);
  return result;
}

async function wikidataImage(id: string, signal: AbortSignal) {
  const params = new URLSearchParams({ action: 'wbgetentities', ids: id, props: 'claims', format: 'json', origin: '*' });
  const data = await queuedJson(`${WIKIDATA_API}?${params}`, signal) as WikidataResponse;
  const claims = data.entities?.[id]?.claims?.P18 ?? [];
  const claim = claims.find((item) => item.rank === 'preferred') ?? claims.find((item) => item.rank !== 'deprecated');
  const value = claim?.mainsnak?.datavalue?.value;
  return typeof value === 'string' ? value : null;
}

function plainText(value?: string) {
  return (value ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

async function commonsPhoto(file: string, signal: AbortSignal): Promise<RecommendationPhoto | null> {
  const params = new URLSearchParams({ action: 'query', format: 'json', origin: '*', titles: `File:${file}`,
    prop: 'imageinfo', iiprop: 'url|mime|extmetadata', iiurlwidth: '1000' });
  const data = await queuedJson(`${COMMONS_API}?${params}`, signal) as CommonsResponse;
  const info = Object.values(data.query?.pages ?? {})[0]?.imageinfo?.[0];
  if (!info || !['image/jpeg', 'image/png', 'image/webp'].includes(info.mime ?? '')) return null;
  const url = info.thumburl ?? info.url;
  if (!url || !info.descriptionurl) return null;
  const artist = plainText(info.extmetadata?.Artist?.value);
  const license = plainText(info.extmetadata?.LicenseShortName?.value);
  return { url, sourceUrl: info.descriptionurl, credit: [artist, license].filter(Boolean).join(' · ') || 'Wikimedia Commons' };
}

export async function findExactPlacePhoto(name: string, city: string, country: string, center: Coordinates | null, signal: AbortSignal) {
  const place = await searchNominatimPhotoPlace(name, [name, city, country].filter(Boolean).join(', '), center, signal);
  if (!place) return null;
  const file = place.commonsFile ?? (place.wikidataId ? await wikidataImage(place.wikidataId, signal) : null);
  return file ? commonsPhoto(file, signal) : null;
}
