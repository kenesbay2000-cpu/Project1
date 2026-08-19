import { useEffect, useMemo, useState } from 'react';
import type { RecommendationTier, TripPlan } from './aiPlanner';
import { findTripLocation } from './tripLocation';
import { illustrativePhoto, type RecommendationPhoto, type RecommendationPhotoKind } from './placePhotoFallbacks';
import { findExactPlacePhoto } from './placePhotoProvider';
import { recommendationTier } from './recommendationTiers';

const CACHE_KEY = 'roamly.place-photos.v1';
const EXACT_TTL_MS = 30 * 86_400_000;
const MISS_TTL_MS = 86_400_000;
type CacheEntry = { checkedAt: number; photo: RecommendationPhoto | null };
export type RecommendationPhotoState = { loading: boolean; photo: RecommendationPhoto };

function cacheKey(kind: RecommendationPhotoKind, name: string, plan: TripPlan) {
  return [kind, name, plan.destination.city, plan.destination.country].join('|').toLocaleLowerCase('en-US');
}

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}') as Record<string, CacheEntry>; }
  catch { return {} as Record<string, CacheEntry>; }
}

function usableEntry(entry?: CacheEntry) {
  if (!entry || typeof entry.checkedAt !== 'number') return false;
  return Date.now() - entry.checkedAt < (entry.photo ? EXACT_TTL_MS : MISS_TTL_MS);
}

function saveCache(cache: Record<string, CacheEntry>) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(Object.entries(cache).slice(-180)))); }
  catch { /* Photos still load when browser storage is unavailable. */ }
}

export function useRecommendationPhotos(
  plan: TripPlan,
  kind: RecommendationPhotoKind,
  items: Array<{ name: string; tier?: RecommendationTier }>,
) {
  const entries = useMemo(() => items.map((item, index) => ({
    key: cacheKey(kind, item.name, plan), name: item.name,
    fallback: illustrativePhoto(kind, recommendationTier(item.tier, index, items.length)),
  })), [items, kind, plan]);
  const [states, setStates] = useState<Record<string, RecommendationPhotoState>>({});

  useEffect(() => {
    const controller = new AbortController();
    const cache = readCache();
    const initial = Object.fromEntries(entries.map((entry) => {
      const saved = cache[entry.key];
      return [entry.key, { loading: !usableEntry(saved), photo: saved?.photo ?? entry.fallback }];
    }));
    setStates(initial);

    async function load() {
      const center = await findTripLocation(plan.destination.city, plan.destination.country, controller.signal).catch(() => null);
      for (const entry of entries) {
        if (controller.signal.aborted) return;
        if (usableEntry(cache[entry.key])) continue;
        try {
          const photo = await findExactPlacePhoto(entry.name, plan.destination.city, plan.destination.country, center, controller.signal);
          cache[entry.key] = { checkedAt: Date.now(), photo };
          saveCache(cache);
          setStates((current) => ({ ...current, [entry.key]: { loading: false, photo: photo ?? entry.fallback } }));
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') throw error;
          setStates((current) => ({ ...current, [entry.key]: { loading: false, photo: entry.fallback } }));
        }
      }
    }
    void load().catch((error) => {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        setStates((current) => Object.fromEntries(entries.map((entry) => {
          const saved = current[entry.key];
          return [entry.key, saved && !saved.loading ? saved : { loading: false, photo: entry.fallback }];
        })));
      }
    });
    return () => controller.abort();
  }, [entries, plan.destination.city, plan.destination.country]);

  return (name: string) => states[cacheKey(kind, name, plan)];
}
