import { requestGemini, type GeminiResult } from './gemini.ts';
import type { PlannerRequest, TripSummary } from './types.ts';

export const TRIP_SUMMARY_SCHEMA = {
  type: 'object',
  properties: {
    destination: { type: 'string' },
    originCity: { type: 'string' },
    dates: {
      type: 'object',
      properties: { start: { type: 'string' }, end: { type: 'string' } },
      required: ['start', 'end'],
    },
    durationDays: { type: 'integer' },
    travelers: {
      type: 'object',
      properties: {
        count: { type: 'integer' },
        ages: { type: 'array', items: { type: 'integer' } },
        description: { type: 'string' },
      },
      required: ['count', 'ages', 'description'],
    },
    budget: {
      type: 'object',
      properties: {
        min: { type: 'number' },
        max: { type: 'number' },
        currency: { type: 'string' },
      },
      required: ['min', 'max', 'currency'],
    },
    interests: { type: 'array', items: { type: 'string' } },
    pace: { type: 'string' },
    lodging: { type: 'string' },
    transport: { type: 'string' },
    constraints: { type: 'array', items: { type: 'string' } },
    otherDetails: { type: 'array', items: { type: 'string' } },
  },
  required: ['destination', 'originCity', 'dates', 'durationDays', 'travelers', 'budget', 'interests', 'pace', 'lodging', 'transport', 'constraints', 'otherDetails'],
};

type GeminiFailure = Extract<GeminiResult, { ok: false }>;
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function text(value: unknown, max = 300) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}
function number(value: unknown, max: number) {
  return Number.isFinite(value) && Number(value) >= 0 ? Math.min(Number(value), max) : 0;
}
function texts(value: unknown, maxItems = 12) {
  return Array.isArray(value) ? value.map((item) => text(item)).filter(Boolean).slice(0, maxItems) : [];
}
function ages(value: unknown) {
  return Array.isArray(value)
    ? value.filter((age) => Number.isInteger(age) && age >= 0 && age <= 120).map(Number).slice(0, 20)
    : [];
}

export function parseTripSummary(value: unknown): TripSummary | null {
  if (!isRecord(value) || !isRecord(value.dates) || !isRecord(value.travelers) || !isRecord(value.budget)) return null;
  const budgetMax = number(value.budget.max, 1_000_000_000);
  const budgetMin = Math.min(number(value.budget.min, 1_000_000_000), budgetMax || 1_000_000_000);
  return {
    destination: text(value.destination),
    originCity: text(value.originCity, 120),
    dates: { start: text(value.dates.start, 10), end: text(value.dates.end, 10) },
    durationDays: Math.round(number(value.durationDays, 365)),
    travelers: {
      count: Math.round(number(value.travelers.count, 20)),
      ages: ages(value.travelers.ages),
      description: text(value.travelers.description),
    },
    budget: {
      min: budgetMin,
      max: budgetMax,
      currency: text(value.budget.currency, 3).toUpperCase(),
    },
    interests: texts(value.interests),
    pace: text(value.pace),
    lodging: text(value.lodging),
    transport: text(value.transport),
    constraints: texts(value.constraints),
    otherDetails: texts(value.otherDetails),
  };
}

function buildSummaryPrompt(request: PlannerRequest, currentSummary?: TripSummary, correction?: string) {
  return `Составь короткую структурированную сводку поездки для подтверждения пользователем.
Исходные данные и диалог: ${JSON.stringify(request)}
${currentSummary ? `Текущая сводка: ${JSON.stringify(currentSummary)}` : ''}
${correction ? `Последняя правка пользователя, имеющая наивысший приоритет: ${correction}` : ''}

Правила:
- Собери только фактически указанные сведения, не выдумывай предпочтения.
- При правке сохрани все части текущей сводки, которых правка не касается.
- destination — желаемые города, регионы или страны одной понятной строкой.
- Даты верни как YYYY-MM-DD, если они известны; иначе пустые строки. durationDays включает оба крайних дня.
- Неизвестные строки и массивы оставляй пустыми, неизвестные числа — 0.
- Бюджет сохраняй в указанной валюте без конвертации.
- Следи, чтобы нижняя граница бюджета не превышала верхнюю; при правке уменьшай нижнюю границу при необходимости.
- interests — интересы и пожелания к содержанию; constraints — ограничения и особые потребности.
- otherDetails — только важные детали, которые не подходят в остальные поля.
- Формулировки должны быть короткими, спокойными и понятными на русском языке.`;
}

export async function createTripSummary(
  request: PlannerRequest,
  currentSummary?: TripSummary,
  correction?: string,
): Promise<GeminiFailure | { ok: true; summary: TripSummary }> {
  const result = await requestGemini(buildSummaryPrompt(request, currentSummary, correction), 30_000, {
    systemInstruction: 'Ты внимательный travel-консьерж. Точно своди собранные сведения и применяй правки пользователя без домыслов.',
    responseSchema: TRIP_SUMMARY_SCHEMA,
    temperature: 0.15,
    maxOutputTokens: 1_500,
  });
  if (!result.ok) return result;
  let raw: unknown;
  try { raw = JSON.parse(result.text); } catch { raw = null; }
  const summary = parseTripSummary(raw);
  if (!summary) {
    return { ok: false, code: 'AI_UNAVAILABLE', message: 'ИИ не смог подготовить сводку поездки. Попробуйте ещё раз.', status: 502 };
  }
  return { ok: true, summary };
}
