import { getTripPlanValidationIssue, TRIP_PLAN_SCHEMA } from './tripPlan.ts';
import type { TripDay, TripPlan } from './types.ts';

export type TripPlanCore = Omit<TripPlan, 'days'>;

const planProperties = TRIP_PLAN_SCHEMA.properties as Record<string, unknown>;
const coreProperties = Object.fromEntries(Object.entries(planProperties).filter(([key]) => key !== 'days'));

export const TRIP_PLAN_CORE_SCHEMA = {
  type: 'object',
  properties: coreProperties,
  required: TRIP_PLAN_SCHEMA.required.filter((key) => key !== 'days'),
};

export const TRIP_DAYS_SCHEMA = {
  type: 'object',
  properties: { days: planProperties.days },
  required: ['days'],
};

const validationDay: TripDay = {
  day: 1,
  date: 'День 1',
  pace: 'balanced',
  title: 'Проверка структуры',
  activities: [{
    time: '10:00', title: 'Проверка', place: 'Проверка', area: 'Проверка',
    description: 'Техническая проверка структуры.', estimatedCost: 0,
    durationMinutes: 60, travelMinutesFromPrevious: 0,
  }],
};

function parseJson(text: string): unknown {
  try { return JSON.parse(text); } catch { return null; }
}

export function parseTripPlanCore(value: unknown): { value: TripPlanCore } | { error: string } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return { error: 'Каркас плана не является объектом.' };
  const candidate = { ...(value as Record<string, unknown>), days: [validationDay] };
  const issue = getTripPlanValidationIssue(candidate, true);
  if (issue) return { error: issue };
  const { days: _days, ...core } = candidate as TripPlan;
  return { value: core };
}

export function parseTripPlanCoreText(text: string) {
  return parseTripPlanCore(parseJson(text));
}

export function parseTripDaysText(text: string, core: TripPlanCore, startDay: number, endDay: number) {
  const parsed = parseJson(text);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return { error: 'Блок дней не является объектом.' };
  const days = (parsed as Record<string, unknown>).days;
  if (!Array.isArray(days) || days.length !== endDay - startDay + 1) return { error: 'Блок содержит неверное количество дней.' };
  const issue = getTripPlanValidationIssue({ ...core, days }, true);
  if (issue) return { error: issue };
  const typedDays = days as TripDay[];
  if (typedDays.some((day, index) => day.day !== startDay + index)) return { error: 'Номера дней блока идут непоследовательно.' };
  return { value: typedDays };
}
