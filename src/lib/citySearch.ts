const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

export type CityOption = {
  id: number;
  name: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
};

type GeocodingResult = {
  id: number;
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  feature_code?: string;
};

type GeocodingResponse = { results?: GeocodingResult[] };

export function formatCityOption(city: CityOption) {
  return [city.name, city.region, city.country]
    .filter((part, index, parts) => part && parts.indexOf(part) === index)
    .join(', ');
}

export async function searchCities(query: string, signal?: AbortSignal): Promise<CityOption[]> {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2) return [];

  const params = new URLSearchParams({
    name: normalizedQuery,
    count: '10',
    language: 'ru',
    format: 'json',
  });
  const response = await fetch(`${GEOCODING_URL}?${params}`, { signal });
  if (!response.ok) throw new Error('Не удалось загрузить список городов.');

  const data = await response.json() as GeocodingResponse;
  return (data.results ?? [])
    .filter((place) => place.feature_code?.startsWith('PPL'))
    .map((place) => ({
      id: place.id,
      name: place.name,
      country: place.country ?? '',
      region: place.admin1 ?? '',
      latitude: place.latitude,
      longitude: place.longitude,
    }));
}
