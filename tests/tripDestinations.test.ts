import assert from 'node:assert/strict';
import test from 'node:test';
import { buildDestinationChunks } from '../src/lib/tripDestinations.ts';
import type { PlannerRequest, TripPlan } from '../src/lib/aiPlannerTypes.ts';

const destination: TripPlan['destination'] = { city: 'Tokyo', country: 'Japan' };

function request(destinations: NonNullable<PlannerRequest['confirmedSummary']>['destinations'], durationDays: number): PlannerRequest {
  return {
    prompt: 'test',
    confirmedSummary: {
      destination: destinations?.map((item) => item.city).join(', ') ?? 'Tokyo', destinations,
      originCity: 'Almaty', dates: { start: '', end: '' }, durationDays,
      travelers: { count: 1, ages: [], description: '' }, budget: { min: 1, max: 2, currency: 'USD' },
      interests: [], pace: '', lodging: '', transport: '', constraints: [], otherDetails: [],
    },
  };
}

test('keeps a seven-day single-city trip sequential and complete', () => {
  const chunks = buildDestinationChunks(request([{ city: 'Tokyo', country: 'Japan', days: 7 }], 7), destination, 7);
  assert.deepEqual(chunks.map(({ startDay, endDay, clusterIndex }) => [startDay, endDay, clusterIndex]), [[1, 4, 0], [5, 7, 1]]);
});

test('splits a 30-day Tokyo Kyoto Osaka trip by city before day chunks', () => {
  const stops = ['Tokyo', 'Kyoto', 'Osaka'].map((city) => ({ city, country: 'Japan', days: 10 }));
  const chunks = buildDestinationChunks(request(stops, 30), destination, 30);
  const cityByDay = chunks.flatMap((chunk) => Array.from({ length: chunk.endDay - chunk.startDay + 1 }, () => chunk.city));
  assert.deepEqual(cityByDay, [...Array(10).fill('Tokyo'), ...Array(10).fill('Kyoto'), ...Array(10).fill('Osaka')]);
  assert.deepEqual(chunks.flatMap((chunk) => Array.from({ length: chunk.endDay - chunk.startDay + 1 }, (_, index) => chunk.startDay + index)), Array.from({ length: 30 }, (_, index) => index + 1));
});
