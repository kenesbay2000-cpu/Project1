import type { PlannerRequest, TripPlan } from './aiPlannerTypes';

export type TripDestinationChunk = {
  city: string;
  country: string;
  startDay: number;
  endDay: number;
  clusterIndex: number;
  clusterCount: number;
};

function legacyCities(value: string, country: string) {
  const clean = (item: string) => item.trim().replace(/^[\s–—→>-]+|[\s–—→>-]+$/g, '').replace(/\s+/g, ' ');
  const parts = value.replace(/\s+(?:и|and|then|затем|мен|және)\s+/giu, ',').split(/[,;\n/→]+/).map(clean).filter(Boolean);
  const cities = parts.filter((part) => part.toLocaleLowerCase() !== clean(country).toLocaleLowerCase());
  return cities.length > 1 ? cities : [clean(value)].filter(Boolean);
}

function allocate(weights: number[], total: number) {
  const basis = weights.every((value) => value > 0) ? weights : weights.map(() => 1);
  const sum = basis.reduce((value, item) => value + item, 0);
  const raw = basis.map((value) => value * Math.max(total, basis.length) / sum);
  const days = raw.map((value) => Math.max(1, Math.floor(value)));
  while (days.reduce((value, item) => value + item, 0) < total) {
    const fractions = raw.map((value, index) => value - days[index]);
    days[fractions.indexOf(Math.max(...fractions))] += 1;
  }
  while (days.reduce((value, item) => value + item, 0) > total) {
    const index = days.lastIndexOf(Math.max(...days));
    if (days[index] > 1) days[index] -= 1; else break;
  }
  return days;
}

export function buildDestinationChunks(request: PlannerRequest, destination: TripPlan['destination'], totalDays: number, chunkSize = 4) {
  const structured = request.confirmedSummary?.destinations?.filter((item) => item.city.trim()) ?? [];
  const stops = structured.length ? structured : legacyCities(request.confirmedSummary?.destination || destination.city, destination.country)
    .map((city) => ({ city, country: destination.country, days: 0 }));
  const days = allocate(stops.map((stop) => stop.days), totalDays);
  const chunks: TripDestinationChunk[] = [];
  let cursor = 1;
  stops.forEach((stop, index) => {
    const stopEnd = cursor + days[index] - 1;
    const stopDays = days[index];
    const clusterCount = stopDays >= 6 ? Math.min(4, Math.ceil(stopDays / chunkSize)) : 1;
    const clusterDays = allocate(Array.from({ length: clusterCount }, () => 1), stopDays);
    let clusterCursor = cursor;
    clusterDays.forEach((clusterLength, clusterIndex) => {
      const clusterEnd = clusterCursor + clusterLength - 1;
      for (let startDay = clusterCursor; startDay <= clusterEnd; startDay += chunkSize) {
        chunks.push({ city: stop.city, country: stop.country || destination.country, startDay,
          endDay: Math.min(clusterEnd, startDay + chunkSize - 1), clusterIndex, clusterCount });
      }
      clusterCursor = clusterEnd + 1;
    });
    cursor = stopEnd + 1;
  });
  return chunks;
}
