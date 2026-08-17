import type { TripPlan } from './types.ts';
import { hasValidTripPlanExtras, TRIP_PLAN_EXTRA_PROPERTIES } from './tripPlanExtras.ts';

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
          title: text,
          activities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                time: text,
                title: text,
                place: text,
                description: text,
                estimatedCost: money,
              },
              required: ['time', 'title', 'place', 'description', 'estimatedCost'],
            },
          },
        },
        required: ['day', 'title', 'activities'],
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
    rationale: text,
  },
  required: [
    'title', 'destination', 'days', 'placeIdeas', 'budget', 'transport', 'accommodations',
    'food', 'activities', 'usefulLinks', 'checklist', 'rationale',
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

function isActivity(value: unknown) {
  return isRecord(value) && isText(value.time) && isText(value.title) && isText(value.place)
    && isText(value.description) && isMoney(value.estimatedCost);
}

function isDay(value: unknown) {
  return isRecord(value) && Number.isInteger(value.day) && Number(value.day) > 0 && isText(value.title)
    && Array.isArray(value.activities) && value.activities.length > 0 && value.activities.every(isActivity);
}

function isPlace(value: unknown) {
  return isRecord(value) && isText(value.name) && isText(value.type) && isText(value.description);
}

function isBudgetCategory(value: unknown) {
  return isRecord(value) && isText(value.category) && isMoney(value.amount) && isText(value.note);
}

export function isTripPlan(value: unknown): value is TripPlan {
  if (!isRecord(value) || !isText(value.title) || !isText(value.rationale)) return false;
  const destination = value.destination;
  const budget = value.budget;
  return isRecord(destination) && isText(destination.city) && isText(destination.country)
    && Array.isArray(value.days) && value.days.length > 0 && value.days.length <= 30 && value.days.every(isDay)
    && Array.isArray(value.placeIdeas) && value.placeIdeas.length > 0 && value.placeIdeas.every(isPlace)
    && isRecord(budget) && isText(budget.currency) && isMoney(budget.total)
    && Array.isArray(budget.categories) && budget.categories.length > 0 && budget.categories.every(isBudgetCategory)
    && hasValidTripPlanExtras(value);
}
