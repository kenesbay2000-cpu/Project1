import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildDestinationChunks } from '../src/lib/tripDestinations.ts';

function envFile() {
  return Object.fromEntries(readFileSync('.env', 'utf8').split(/\r?\n/).flatMap((line) => {
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line.trim());
    return match ? [[match[1], match[2].replace(/^['"]|['"]$/g, '')]] : [];
  }));
}

const env = envFile();
const endpoint = `${env.VITE_SUPABASE_URL}/functions/v1/ai`;
const headers = {
  apikey: env.VITE_SUPABASE_ANON_KEY,
  Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

async function invoke(body) {
  const response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(148_000) });
  const data = await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${data?.error?.message ?? 'unknown function error'}`);
  return data;
}

function plannerRequest(name, start, end, destinations) {
  const durationDays = Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000) + 1;
  const destination = destinations.map((item) => item.city).join(', ');
  return {
    prompt: `${name}: спокойный культурный маршрут`, responseLanguage: 'ru', originCity: 'Алматы',
    dates: { start, end }, travelers: 1, priceRange: { min: 1_500_000, max: 4_000_000, currency: 'KZT' },
    confirmedSummary: {
      destination, destinations, originCity: 'Алматы', dates: { start, end }, durationDays,
      travelers: { count: 1, ages: [25], description: 'один взрослый' },
      budget: { min: 1_500_000, max: 4_000_000, currency: 'KZT' }, interests: ['культура', 'еда'],
      pace: 'сбалансированный', lodging: 'комфортно', transport: 'общественный транспорт', constraints: [], otherDetails: [],
    },
  };
}

async function verify(name, request) {
  const overview = await invoke({ mode: 'generate_overview', request });
  assert.ok(overview.core, `${name}: overview was not generated`);
  const totalDays = request.confirmedSummary.durationDays;
  const chunks = buildDestinationChunks(request, overview.core.destination, totalDays);
  const days = [];
  const cityAreas = new Map();
  for (const chunk of chunks) {
    const result = await invoke({
      mode: 'generate_days', request, core: overview.core, startDay: chunk.startDay, endDay: chunk.endDay,
      destination: { city: chunk.city, country: chunk.country, clusterIndex: chunk.clusterIndex, clusterCount: chunk.clusterCount },
      previousDay: days[days.length - 1],
    });
    assert.equal(result.warnings?.length ?? 0, 0, `${name}: travel data warning for ${chunk.city}`);
    assert.equal(result.days?.length, chunk.endDay - chunk.startDay + 1, `${name}: incomplete chunk for ${chunk.city}`);
    const activities = result.days.flatMap((day) => day.activities);
    assert.ok(activities.length > 0, `${name}: empty activities for ${chunk.city}`);
    const areas = cityAreas.get(chunk.city) ?? new Set();
    activities.forEach((activity) => areas.add(activity.area));
    cityAreas.set(chunk.city, areas);
    days.push(...result.days);
    console.log(`${name}: days ${chunk.startDay}-${chunk.endDay}, ${chunk.city}, cluster ${chunk.clusterIndex + 1}/${chunk.clusterCount}, ${activities.length} activities, server ${result.elapsedMs} ms`);
  }
  assert.deepEqual(days.map((day) => day.day), Array.from({ length: totalDays }, (_, index) => index + 1));
  assert.ok(days.every((day) => day.activities.length <= 5));
  console.log(`${name}: PASS — ${days.length} days; ${[...cityAreas].map(([city, areas]) => `${city}: ${[...areas].join(', ')}`).join(' | ')}`);
}

const scenario = process.argv[2] ?? 'single';
if (scenario === 'single') {
  await verify('single-city', plannerRequest('Стамбул на 7 дней', '2026-10-01', '2026-10-07', [
    { city: 'Стамбул', country: 'Турция', days: 7 },
  ]));
} else if (scenario === 'multi') {
  await verify('multi-city', plannerRequest('Япония на 30 дней', '2026-10-01', '2026-10-30', [
    { city: 'Токио', country: 'Япония', days: 10 },
    { city: 'Киото', country: 'Япония', days: 10 },
    { city: 'Осака', country: 'Япония', days: 10 },
  ]));
} else {
  throw new Error('Use "single" or "multi".');
}
