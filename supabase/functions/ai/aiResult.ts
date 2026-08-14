import { isTripPlan, TRIP_PLAN_SCHEMA } from './tripPlan.ts';
import type { PlannerAIResult } from './types.ts';

export const PLANNER_AI_RESULT_SCHEMA = {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      enum: ['success', 'budget_too_low'],
      description: 'success when a realistic plan is possible; budget_too_low only when the maximum budget cannot cover a basic trip.',
    },
    message: {
      type: 'string',
      description: 'Empty for success; a short Russian explanation for budget_too_low.',
    },
    plan: {
      anyOf: [TRIP_PLAN_SCHEMA, { type: 'null' }],
      description: 'A complete trip plan for success; null for budget_too_low.',
    },
  },
  required: ['status', 'message', 'plan'],
};

type ParseResult = { value: PlannerAIResult } | { error: string };

export function parsePlannerAIResult(text: string): ParseResult {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { error: 'Response is not valid JSON' };
  }

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { error: 'Response is not an object' };
  }
  if (value.status === 'budget_too_low' && value.plan === null && typeof value.message === 'string') {
    return { value: { status: 'budget_too_low', message: value.message, plan: null } };
  }
  if (value.status === 'success' && typeof value.message === 'string' && isTripPlan(value.plan)) {
    return { value: { status: 'success', message: value.message, plan: value.plan } };
  }
  return { error: 'Response does not match the planner result schema' };
}
