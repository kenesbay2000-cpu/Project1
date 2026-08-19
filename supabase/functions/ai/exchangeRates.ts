import { SUPPORTED_CURRENCIES, isSupportedCurrency } from './currencies.ts';

export type CurrencyRates = Readonly<Record<string, number>>;

type ExchangeRateRow = {
  currency: unknown;
  kzt_per_unit: unknown;
  fetched_at: unknown;
};

type RatesResult = { ok: true; rates: CurrencyRates } | { ok: false; message: string };
type RatesCache = { rates: CurrencyRates; loadedAt: number; oldestFetch: number };

const CACHE_TTL_MS = 6 * 60 * 60 * 1_000;
const STALE_AFTER_MS = 14 * 24 * 60 * 60 * 1_000;
let cache: RatesCache | null = null;

function cachedResult(reason?: string): RatesResult | null {
  if (!cache) return null;
  if (reason) console.warn(`Using cached exchange rates: ${reason}`);
  if (Date.now() - cache.oldestFetch > STALE_AFTER_MS) {
    console.warn('Exchange rates have not been refreshed successfully for more than 14 days.');
  }
  return { ok: true, rates: cache.rates };
}

export async function loadExchangeRates(): Promise<RatesResult> {
  if (cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) return cachedResult()!;
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !anonKey) {
    return cachedResult('Supabase environment is unavailable')
      ?? { ok: false, message: 'Exchange-rate storage is unavailable.' };
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/exchange_rates?select=currency,kzt_per_unit,fetched_at&currency=in.(${SUPPORTED_CURRENCIES.join(',')})`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } },
    );
    if (!response.ok) throw new Error(`database returned ${response.status}`);
    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) throw new Error('database returned an invalid payload');

    const rates: Record<string, number> = {};
    const fetchedTimes: number[] = [];
    for (const value of payload) {
      if (typeof value !== 'object' || value === null) continue;
      const row = value as ExchangeRateRow;
      const currency = typeof row.currency === 'string' ? row.currency : '';
      const rate = Number(row.kzt_per_unit);
      const fetchedAt = typeof row.fetched_at === 'string' ? Date.parse(row.fetched_at) : Number.NaN;
      if (isSupportedCurrency(currency) && Number.isFinite(rate) && rate > 0 && Number.isFinite(fetchedAt)) {
        rates[currency] = rate;
        fetchedTimes.push(fetchedAt);
      }
    }
    if (SUPPORTED_CURRENCIES.some((currency) => !rates[currency]) || fetchedTimes.length !== SUPPORTED_CURRENCIES.length) {
      throw new Error('one or more required currencies are missing');
    }
    cache = { rates, loadedAt: Date.now(), oldestFetch: Math.min(...fetchedTimes) };
    return cachedResult()!;
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown database error';
    return cachedResult(reason) ?? { ok: false, message: `Exchange rates could not be loaded: ${reason}` };
  }
}
