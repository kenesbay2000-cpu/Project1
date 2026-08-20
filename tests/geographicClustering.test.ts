import assert from 'node:assert/strict';
import test from 'node:test';
import { clusterPlacesByCoordinates } from '../supabase/functions/ai/geographicClustering.ts';
import type { PlaceCandidate } from '../supabase/functions/ai/travelPlaceData.ts';

function placesAround(name: string, latitude: number, longitude: number): PlaceCandidate[] {
  return Array.from({ length: 8 }, (_, index) => ({
    name: `${name} ${index}`,
    latitude: latitude + index * 0.0002,
    longitude: longitude + index * 0.0002,
    area: name,
    category: 'tourism.sights',
  }));
}

test('groups real coordinates into separate nearby areas', () => {
  const places = [
    ...placesAround('Shinjuku', 35.6938, 139.7034),
    ...placesAround('Asakusa', 35.7148, 139.7967),
  ];
  const clusters = clusterPlacesByCoordinates(places, 'Tokyo', 2);
  assert.equal(clusters.length, 2);
  assert.deepEqual(clusters.map((cluster) => cluster.places.length), [8, 8]);
  assert.ok(clusters.every((cluster) => new Set(cluster.places.map((place) => place.area)).size === 1));
});

test('keeps compact single-city candidates in one cluster', () => {
  const clusters = clusterPlacesByCoordinates(placesAround('Old Town', 41.0082, 28.9784), 'Istanbul', 3);
  assert.equal(clusters.length, 1);
  assert.equal(clusters[0].places.length, 8);
});
