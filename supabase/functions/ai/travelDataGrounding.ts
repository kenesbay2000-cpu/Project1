import { loadDestinationFacts } from './destinationFacts.ts';
import { loadPlaceCandidates, type PlaceCandidate, type PlaceKind } from './travelPlaceData.ts';
import type { TripDay, TripPlan } from './types.ts';

type Grounding = { prompt: string; names: Set<string>; places: PlaceCandidate[] };

function normalizeName(value: string) {
  return value.normalize('NFKD').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
}

function placePrompt(places: PlaceCandidate[], provider: string) {
  return `ПРОВЕРЕННЫЕ МЕСТА ИЗ ${provider.toUpperCase()} API:\n${JSON.stringify(places)}\n`+
    'Используй только точные name из этого списка. Не придумывай и не переименовывай организации. Адрес, район, категорию и сайт считай более надёжными, чем знания модели.';
}

export async function loadPlaceGrounding(city: string, country: string, kind: PlaceKind, offset = 0): Promise<Grounding> {
  const result = await loadPlaceCandidates(city, country, kind);
  const places = result.places.length > 30
    ? [...result.places.slice(offset % result.places.length), ...result.places.slice(0, offset % result.places.length)].slice(0, 30)
    : result.places;
  return { places, names: new Set(places.map((place) => normalizeName(place.name))),
    prompt: places.length >= 6 ? placePrompt(places, result.provider) : 'API мест не вернул достаточно надёжных кандидатов. Не утверждай, что конкретные организации проверены.' };
}

export async function loadDestinationGrounding(city: string, country: string) {
  const facts = await loadDestinationFacts(city, country);
  return facts
    ? `ПРОВЕРЕННЫЕ ФАКТЫ ИЗ OPEN-METEO GEOCODING API: ${JSON.stringify(facts)}. Не противоречь этим данным; визовые, медицинские и юридические требования советуй проверить в официальных источниках.`
    : 'API направления временно недоступен. Не выдумывай официальные требования, телефоны и документы; советуй проверить их в официальных источниках.';
}

export function hasGroundedSectionNames(items: unknown[], names: Set<string>) {
  if (names.size < 6) return false;
  return items.every((item) => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) return false;
    const value = (item as Record<string, unknown>).name;
    return typeof value === 'string' && names.has(normalizeName(value));
  });
}

export function hasGroundedDayPlaces(days: TripDay[], names: Set<string>) {
  if (names.size < 6) return false;
  const activities = days.flatMap((day) => day.activities);
  return activities.length > 0 && activities.every((activity) => names.has(normalizeName(activity.place)));
}

export function destinationOf(core: Pick<TripPlan, 'destination'>) {
  return { city: core.destination.city.trim(), country: core.destination.country.trim() };
}
