import { searchCities } from './citySearch';
import { destinations } from './destinations';

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
  return destinations.find((item) => normalize(item.city) === normalizedCity
    && (!normalizedCountry || normalize(item.country) === normalizedCountry));
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
