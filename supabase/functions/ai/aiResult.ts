import { getTripPlanValidationIssue, isTripPlan, TRIP_PLAN_SCHEMA } from './tripPlan.ts';
import { getPlanRealismIssue } from './tripPlanRealism.ts';
import { limitAdjustedActivities, normalizePlanSchedule } from './tripPlanNormalization.ts';
import type { PlannerAIResult, PlannerRequest } from './types.ts';

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parsePlannerAIResult(text: string, request: PlannerRequest): ParseResult {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { error: 'Response is not valid JSON' };
  }

  if (!isRecord(value)) {
    return { error: 'Response is not an object' };
  }
  if (value.status === 'budget_too_low' && value.plan === null && typeof value.message === 'string') {
    return { value: { status: 'budget_too_low', message: value.message, plan: null } };
  }
  const normalizedPlan = limitAdjustedActivities(value.plan);
  if (value.status === 'success' && typeof value.message === 'string' && isTripPlan(normalizedPlan)) {
    const scheduledPlan = normalizePlanSchedule(normalizedPlan);
    const realismIssue = getPlanRealismIssue(scheduledPlan, request);
    if (realismIssue) return { error: `Plan realism check failed: ${realismIssue}` };
    return { value: { status: 'success', message: value.message, plan: scheduledPlan } };
  }
  if (value.status === 'success' && typeof value.message === 'string') {
    return { error: `Plan schema check failed: ${getTripPlanValidationIssue(normalizedPlan) ?? 'неизвестная ошибка схемы.'}` };
  }
  return { error: 'Response does not match the planner result schema' };
}
