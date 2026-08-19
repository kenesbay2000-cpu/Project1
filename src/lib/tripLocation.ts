import { searchCities } from './citySearch';
import { destinations } from './destinations';
import { getDestinations } from './content';

export type TripLocation = {
  latitude: number;
  longitude: number;
  catalogSlug?: string;
};

function normalize(value: string) {
  return value.trim().toLocaleLowerCase('ru-RU').replace(/ё/g, 'е');
}

export function findCatalogDestination(city: string, country = '') {
  const normalizedCity = normalize(city);
  const normalizedCountry = normalize(country);
  const englishBySlug = new Map(getDestinations('en').map((item) => [item.slug, item]));
  return destinations.find((item) => {
    const english = englishBySlug.get(item.slug);
    const cityMatches = normalize(item.city) === normalizedCity || (english && normalize(english.city) === normalizedCity);
    const countryMatches = !normalizedCountry || normalize(item.country) === normalizedCountry
      || (english && normalize(english.country) === normalizedCountry);
    return cityMatches && countryMatches;
  });
}

export async function findTripLocation(city: string, country: string, signal?: AbortSignal): Promise<TripLocation | null> {
  const catalogDestination = findCatalogDestination(city, country);
  if (catalogDestination) {
    return {
      latitude: catalogDestination.coordinates[0],
      longitude: catalogDestination.coordinates[1],
      catalogSlug: catalogDestination.slug,
    };
  }

  const options = await searchCities(city, signal);
  const normalizedCountry = normalize(country);
  const location = options.find((item) => normalize(item.country) === normalizedCountry) ?? options[0];
  return location ? { latitude: location.latitude, longitude: location.longitude } : null;
}
