export type DestinationFacts = {
  canonicalCity: string;
  country: string;
  countryCode: string;
  timezone: string;
  elevation: number | null;
  population: number | null;
  administrativeArea: string;
};

const cache = new Map<string, { expiresAt: number; facts: DestinationFacts | null }>();

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

export async function loadDestinationFacts(city: string, country: string) {
  const key = `${city}|${country}`.trim().toLocaleLowerCase();
  const saved = cache.get(key);
  if (saved && saved.expiresAt > Date.now()) return saved.facts;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  let facts: DestinationFacts | null = null;
  try {
    const params = new URLSearchParams({ name: city, count: '8', language: 'en', format: 'json' });
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`Destination facts HTTP ${response.status}`);
    const body = record(await response.json());
    const results = Array.isArray(body?.results) ? body.results.map(record).filter(Boolean) as Record<string, unknown>[] : [];
    const countryKey = country.toLocaleLowerCase();
    const item = results.find((value) => String(value.country ?? '').toLocaleLowerCase().includes(countryKey)) ?? results[0];
    if (item) facts = {
      canonicalCity: String(item.name ?? city), country: String(item.country ?? country),
      countryCode: String(item.country_code ?? ''), timezone: String(item.timezone ?? ''),
      elevation: Number.isFinite(Number(item.elevation)) ? Number(item.elevation) : null,
      population: Number.isFinite(Number(item.population)) ? Number(item.population) : null,
      administrativeArea: String(item.admin1 ?? item.admin2 ?? ''),
    };
  } catch { facts = null; } finally { clearTimeout(timeout); }
  cache.set(key, { facts, expiresAt: Date.now() + 24 * 60 * 60 * 1_000 });
  return facts;
}
