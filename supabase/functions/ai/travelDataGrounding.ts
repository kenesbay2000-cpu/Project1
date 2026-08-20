import { loadDestinationFacts } from './destinationFacts.ts';
import { loadPlaceCandidates, type PlaceCandidate, type PlaceKind } from './travelPlaceData.ts';
import type { TripDay, TripPlan } from './types.ts';
import { findPlaceNameMatch, normalizePlaceName } from './placeNameMatching.ts';

export type Grounding = { prompt: string; names: Set<string>; places: PlaceCandidate[]; provider: string };

function placePrompt(places: PlaceCandidate[], provider: string) {
  const promptPlaces = places.map(({ photo, ...place }) => ({ ...place, photoAvailable: Boolean(photo) }));
  return `ПРОВЕРЕННЫЕ МЕСТА ИЗ ${provider.toUpperCase()} API:\n${JSON.stringify(promptPlaces)}\n`+
    'Используй только точные name из этого списка. Не придумывай и не переименовывай организации. Адрес, район, категорию и сайт считай более надёжными, чем знания модели.';
}

export async function loadPlaceGrounding(
  city: string,
  country: string,
  kind: PlaceKind,
  offset = 0,
  candidateLimit = 30,
): Promise<Grounding> {
  const result = await loadPlaceCandidates(city, country, kind);
  const places = result.places.length > candidateLimit
    ? [...result.places.slice(offset % result.places.length), ...result.places.slice(0, offset % result.places.length)].slice(0, candidateLimit)
    : result.places;
  return { places, names: new Set(places.map((place) => normalizePlaceName(place.name).compact)), provider: result.provider,
    prompt: places.length > 0 ? placePrompt(places, result.provider) : 'API мест не вернул надёжных кандидатов. Не утверждай, что конкретные организации проверены.' };
}

export async function loadDestinationGrounding(city: string, country: string) {
  const facts = await loadDestinationFacts(city, country);
  return facts
    ? `ПРОВЕРЕННЫЕ ФАКТЫ ИЗ OPEN-METEO GEOCODING API: ${JSON.stringify(facts)}. Не противоречь этим данным; визовые, медицинские и юридические требования советуй проверить в официальных источниках.`
    : 'API направления временно недоступен. Не выдумывай официальные требования, телефоны и документы; советуй проверить их в официальных источниках.';
}

export function canonicalizeGroundedSectionNames<T extends { name: string }>(items: T[], places: PlaceCandidate[]) {
  if (places.length === 0) return null;
  const matched = items.map((item) => ({ item, place: findPlaceNameMatch(item.name, places) }));
  if (matched.some(({ place }) => !place)) return null;
  return matched.map(({ item, place }) => ({ ...item, name: place!.name }));
}

export function attachGroundedPhotos<T extends { name: string }>(items: T[], places: PlaceCandidate[]) {
  const candidates = new Map(places.map((place) => [normalizePlaceName(place.name).compact, place]));
  return items.map((item) => {
    const photo = candidates.get(normalizePlaceName(item.name).compact)?.photo;
    return photo ? { ...item, photo } : item;
  });
}

export function canonicalizeGroundedDayPlaces(days: TripDay[], places: PlaceCandidate[]) {
  if (places.length < 6 || days.every((day) => day.activities.length === 0)) return null;
  const result: TripDay[] = [];
  for (const day of days) {
    const activities = day.activities.map((activity) => {
      const place = findPlaceNameMatch(activity.place, places);
      return place ? { ...activity, place: place.name } : null;
    });
    if (activities.some((activity) => activity === null)) return null;
    result.push({ ...day, activities: activities as TripDay['activities'] });
  }
  return result;
}

export function destinationOf(core: Pick<TripPlan, 'destination'>) {
  return { city: core.destination.city.trim(), country: core.destination.country.trim() };
}
