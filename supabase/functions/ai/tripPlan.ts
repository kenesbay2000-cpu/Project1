import type { TripPlan } from './types.ts';
import { getTripPlanExtrasIssue, TRIP_PLAN_EXTRA_PROPERTIES } from './tripPlanExtras.ts';
import { isRealismAssessment, REALISM_SCHEMA } from './tripPlanRealism.ts';

const text = { type: 'string' };
const money = { type: 'number' };

export const TRIP_PLAN_SCHEMA = {
  type: 'object',
  properties: {
    title: text,
    destination: {
      type: 'object',
      properties: { city: text, country: text },
      required: ['city', 'country'],
    },
    days: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          day: { type: 'integer' },
          date: text,
          pace: { type: 'string', enum: ['active', 'balanced', 'rest'] },
          title: text,
          activities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                time: text,
                title: text,
                place: text,
                area: text,
                description: text,
                estimatedCost: money,
                durationMinutes: { type: 'integer' },
                travelMinutesFromPrevious: { type: 'integer' },
              },
              required: [
                'time', 'title', 'place', 'area', 'description', 'estimatedCost',
                'durationMinutes', 'travelMinutesFromPrevious',
              ],
            },
          },
        },
        required: ['day', 'date', 'pace', 'title', 'activities'],
      },
    },
    placeIdeas: {
      type: 'array',
      items: {
        type: 'object',
        properties: { name: text, type: text, description: text },
        required: ['name', 'type', 'description'],
      },
    },
    budget: {
      type: 'object',
      properties: {
        currency: text,
        total: money,
        categories: {
          type: 'array',
          items: {
            type: 'object',
            properties: { category: text, amount: money, note: text },
            required: ['category', 'amount', 'note'],
          },
        },
      },
      required: ['currency', 'total', 'categories'],
    },
    ...TRIP_PLAN_EXTRA_PROPERTIES,
    realism: REALISM_SCHEMA,
    rationale: text,
  },
  required: [
    'title', 'destination', 'days', 'placeIdeas', 'budget', 'transport', 'accommodations',
    'food', 'activities', 'usefulLinks', 'checklist', 'realism', 'rationale',
  ],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isText(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isMoney(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function getActivityIssue(value: unknown) {
  if (!isRecord(value)) return 'активность не является объектом';
  if (!isText(value.time) || !isText(value.title) || !isText(value.place)) return 'не заполнены время, название или место';
  if (!isText(value.area) || !isText(value.description)) return 'не заполнены район или описание';
  if (!isMoney(value.estimatedCost)) return 'некорректна стоимость';
  if (!Number.isInteger(value.durationMinutes) || Number(value.durationMinutes) < 15
    || Number(value.durationMinutes) > 720) return 'длительность должна быть от 15 до 720 минут';
  if (!Number.isInteger(value.travelMinutesFromPrevious) || Number(value.travelMinutesFromPrevious) < 0
    || Number(value.travelMinutesFromPrevious) > 1_440) return 'время переезда должно быть от 0 до 1440 минут';
  return null;
}

function getDayIssue(value: unknown) {
  if (!isRecord(value) || !Number.isInteger(value.day) || Number(value.day) < 1) return 'некорректен номер дня';
  if (!isText(value.date) || !isText(value.title)) return 'не заполнены дата или название дня';
  if (value.pace !== 'active' && value.pace !== 'balanced' && value.pace !== 'rest') return 'не указан темп дня';
  if (!Array.isArray(value.activities) || value.activities.length === 0) return 'нет активностей';
  const invalidActivity = value.activities.findIndex((activity) => getActivityIssue(activity));
  if (invalidActivity >= 0) return `активность ${invalidActivity + 1}: ${getActivityIssue(value.activities[invalidActivity])}`;
  return null;
}

function isPlace(value: unknown) {
  return isRecord(value) && isText(value.name) && isText(value.type) && isText(value.description);
}

function isBudgetCategory(value: unknown) {
  return isRecord(value) && isText(value.category) && isMoney(value.amount) && isText(value.note);
}

export function getTripPlanValidationIssue(value: unknown, requireTierCoverage = false) {
  if (!isRecord(value)) return 'План не является объектом.';
  if (!isText(value.title) || !isText(value.rationale)) return 'Не заполнены название или объяснение маршрута.';
  const destination = value.destination;
  const budget = value.budget;
  if (!isRecord(destination) || !isText(destination.city) || !isText(destination.country)) {
    return 'Не заполнено направление поездки.';
  }
  if (!Array.isArray(value.days) || value.days.length < 1 || value.days.length > 30) return 'Некорректно количество дней.';
  const invalidDay = value.days.findIndex((day) => getDayIssue(day));
  if (invalidDay >= 0) return `День ${invalidDay + 1}: ${getDayIssue(value.days[invalidDay])}.`;
  if (!Array.isArray(value.placeIdeas) || value.placeIdeas.length === 0 || !value.placeIdeas.every(isPlace)) {
    return 'Не заполнены идеи мест.';
  }
  if (!isRecord(budget) || !isText(budget.currency) || !isMoney(budget.total)
    || !Array.isArray(budget.categories) || budget.categories.length === 0
    || !budget.categories.every(isBudgetCategory)) return 'Не заполнен бюджет.';
  const extrasIssue = getTripPlanExtrasIssue(value, requireTierCoverage);
  if (extrasIssue) return extrasIssue;
  if (!isRealismAssessment(value.realism)) return 'Не заполнена оценка реалистичности.';
  return null;
}

export function isTripPlan(value: unknown): value is TripPlan {
  return getTripPlanValidationIssue(value) === null;
}
