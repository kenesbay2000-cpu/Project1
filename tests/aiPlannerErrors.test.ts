import assert from 'node:assert/strict';
import test from 'node:test';
import { safePlannerError } from '../src/lib/aiPlannerErrors.ts';

test('never exposes an internal day validation instruction', () => {
  const raw = 'Не удалось собрать дни 1-4: Каждое activity.place должно точно совпадать с name из списка API';
  const message = safePlannerError({ code: 'INCOMPLETE_AI_PLAN', message: raw }, 'ru', 'itinerary');
  assert.equal(message, 'Не удалось собрать часть маршрута. Попробуйте ещё раз.');
  assert.doesNotMatch(message, /activity\.place|списка API|точно совпадать/i);
});

test('sanitizes unknown server text in every generation scope', () => {
  const internal = { code: 'UNKNOWN', message: 'Plan schema check failed: missing accommodations[2].tier' };
  for (const scope of ['planner', 'overview', 'itinerary', 'section'] as const) {
    assert.doesNotMatch(safePlannerError(internal, 'ru', scope), /schema|accommodations|tier/i);
  }
});

test('keeps actionable errors human-readable without trusting server text', () => {
  const message = safePlannerError({ code: 'BUDGET_TOO_LOW', message: 'internal budget formula' }, 'ru');
  assert.match(message, /Бюджет слишком низкий/);
  assert.doesNotMatch(message, /formula/);
});
