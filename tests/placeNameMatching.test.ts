import assert from 'node:assert/strict';
import test from 'node:test';
import { findPlaceNameMatch } from '../supabase/functions/ai/placeNameMatching.ts';
import type { PlaceCandidate } from '../supabase/functions/ai/travelPlaceData.ts';

function place(name: string): PlaceCandidate {
  return { name, area: '', address: '', category: 'tourism', categories: ['tourism'], latitude: 0, longitude: 0 };
}

const candidates = [
  place('Angkor Wat'),
  place('Angkor National Museum'),
  place('Angkor History Museum'),
  place('Tuol Sleng Genocide Museum'),
  place('Independence Beach'),
];

test('matches harmless formatting changes and returns the canonical API name', () => {
  assert.equal(findPlaceNameMatch('  “ANGKOR   WAT”  ', candidates)?.name, 'Angkor Wat');
});

test('matches a small typo or a minor omitted qualifier', () => {
  assert.equal(findPlaceNameMatch('Angkor Wot', candidates)?.name, 'Angkor Wat');
  assert.equal(findPlaceNameMatch('Tuol Sleng Museum', candidates)?.name, 'Tuol Sleng Genocide Museum');
});

test('rejects generic, unrelated, and ambiguous names', () => {
  assert.equal(findPlaceNameMatch('Museum', candidates), null);
  assert.equal(findPlaceNameMatch('Royal Palace', candidates), null);
  assert.equal(findPlaceNameMatch('Angkor Museum', candidates), null);
});
