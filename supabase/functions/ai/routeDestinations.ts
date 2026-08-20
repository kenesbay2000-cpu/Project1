import type { PlannerRequest, TripPlan } from './types.ts';

export type RouteDestination = { city: string; country: string; days: number; startDay: number; endDay: number };

function clean(value: string) {
  return value.trim().replace(/^[\s–—→>-]+|[\s–—→>-]+$/g, '').replace(/\s+/g, ' ');
}

function legacyCities(value: string, country: string) {
  const parts = value.replace(/\s+(?:и|and|then|затем|мен|және)\s+/giu, ',')
    .split(/[,;\n/→]+/).map(clean).filter(Boolean);
  const countryKey = clean(country).toLocaleLowerCase();
  const cities = parts.filter((part) => part.toLocaleLowerCase() !== countryKey);
  return cities.length > 1 ? cities : [clean(value)].filter(Boolean);
}

function allocatedDays(weights: number[], totalDays: number) {
  if (weights.length === 0) return [];
  const safeTotal = Math.max(totalDays, weights.length);
  const positive = weights.every((value) => value > 0);
  const basis = positive ? weights : weights.map(() => 1);
  const sum = basis.reduce((total, value) => total + value, 0);
  const raw = basis.map((value) => value * safeTotal / sum);
  const result = raw.map((value) => Math.max(1, Math.floor(value)));
  while (result.reduce((total, value) => total + value, 0) < safeTotal) {
    const fractions = raw.map((value, index) => value - result[index]);
    result[fractions.indexOf(Math.max(...fractions))] += 1;
  }
  while (result.reduce((total, value) => total + value, 0) > safeTotal) {
    const index = result.lastIndexOf(Math.max(...result));
    if (result[index] > 1) result[index] -= 1; else break;
  }
  return result;
}

export function routeDestinations(request: PlannerRequest, core: Pick<TripPlan, 'destination'>, totalDays: number): RouteDestination[] {
  const structured = request.confirmedSummary?.destinations?.filter((item) => item.city.trim()) ?? [];
  const base = structured.length
    ? structured.map((item) => ({ city: clean(item.city), country: clean(item.country || core.destination.country), days: item.days }))
    : legacyCities(request.confirmedSummary?.destination || core.destination.city, core.destination.country)
      .map((city) => ({ city, country: clean(core.destination.country), days: 0 }));
  const unique = base.filter((item, index) => base.findIndex((other) => other.city.toLocaleLowerCase() === item.city.toLocaleLowerCase()) === index).slice(0, 12);
  const days = allocatedDays(unique.map((item) => item.days), totalDays);
  let cursor = 1;
  return unique.map((item, index) => {
    const startDay = cursor;
    cursor += days[index];
    return { ...item, days: days[index], startDay, endDay: cursor - 1 };
  });
}
