import { finalizeGeneratedPlan } from './aiResult.ts';
import { applyBudgetWarning, assessBudget } from './budgetPolicy.ts';
import { generatePlanCore, generatePlanDays, generatePlanExtraSection, generatePlanOverview } from './chunkedGeneration.ts';
import { loadExchangeRates } from './exchangeRates.ts';
import { parsePlannerRequest } from './plannerRequest.ts';
import { localizedPlannerText } from './responseLanguage.ts';
import { parseTripPlanCore, parseTripPlanOverview } from './tripPlanParts.ts';
import type { TripPlanExtraSection } from './tripPlanExtras.ts';
import type { TripDay } from './types.ts';

type ModeResponse = { body: object; status: number } | null;

function failure(code: string, message: string, status: number): ModeResponse {
  return { body: { error: { code, message } }, status };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parsePreviousDay(value: unknown): TripDay | undefined {
  if (!isRecord(value) || !Number.isInteger(value.day) || !Array.isArray(value.activities)) return undefined;
  return value as unknown as TripDay;
}

export async function handleChunkedMode(body: Record<string, unknown>): Promise<ModeResponse> {
  if (body.mode !== 'generate_core' && body.mode !== 'generate_overview' && body.mode !== 'generate_days'
    && body.mode !== 'generate_section' && body.mode !== 'finalize_plan') return null;
  const parsedRequest = parsePlannerRequest(body.request);
  if ('error' in parsedRequest) return failure(parsedRequest.error.code, parsedRequest.error.message, 400);
  const rates = await loadExchangeRates();
  if (!rates.ok) return failure('EXCHANGE_RATES_UNAVAILABLE', rates.message, 503);
  const budget = assessBudget(parsedRequest.value, rates.rates);
  if (budget.level === 'absurdly_low') {
    return failure('BUDGET_TOO_LOW', localizedPlannerText(parsedRequest.value, 'Даже верхняя граница бюджета слишком низкая для этой поездки.', 'Even the upper budget limit is too low for this trip.', 'Бюджеттің жоғарғы шегі де бұл сапар үшін тым төмен.'), 422);
  }

  if (body.mode === 'generate_core' || body.mode === 'generate_overview') {
    const result = body.mode === 'generate_overview' || body.overviewOnly === true
      ? await generatePlanOverview(parsedRequest.value, rates.rates)
      : await generatePlanCore(parsedRequest.value, rates.rates);
    return result.ok
      ? { body: { core: result.value, elapsedMs: result.elapsedMs }, status: 200 }
      : failure(result.code, result.message, result.status);
  }

  if (body.mode === 'finalize_plan') {
    const fullCore = parseTripPlanCore(body.core);
    if ('error' in fullCore) return failure('INVALID_REQUEST', fullCore.error, 400);
    const planResult = finalizeGeneratedPlan({ ...fullCore.value, days: body.days }, parsedRequest.value);
    return 'error' in planResult
      ? failure('INCOMPLETE_AI_PLAN', planResult.error, 502)
      : { body: { plan: applyBudgetWarning(planResult.value, budget, parsedRequest.value.responseLanguage) }, status: 200 };
  }

  const core = parseTripPlanOverview(body.core);
  if ('error' in core) return failure('INVALID_REQUEST', core.error, 400);
  if (body.mode === 'generate_days') {
    const startDay = Number(body.startDay);
    const endDay = Number(body.endDay);
    if (!Number.isInteger(startDay) || !Number.isInteger(endDay) || startDay < 1 || endDay < startDay || endDay - startDay > 4) {
      return failure('INVALID_REQUEST', 'Блок должен содержать от одного до пяти последовательных дней.', 400);
    }
    const result = await generatePlanDays(parsedRequest.value, rates.rates, core.value, startDay, endDay, parsePreviousDay(body.previousDay));
    return result.ok
      ? { body: { days: result.value, elapsedMs: result.elapsedMs }, status: 200 }
      : failure(result.code, result.message, result.status);
  }
  const sections: TripPlanExtraSection[] = ['accommodations', 'food', 'activities', 'usefulLinks', 'checklist'];
  const section = sections.find((item) => item === body.section);
  if (!section) return failure('INVALID_REQUEST', 'Неизвестная вкладка плана.', 400);
  const result = await generatePlanExtraSection(parsedRequest.value, rates.rates, core.value, section);
  return result.ok
    ? { body: { section, items: result.value, elapsedMs: result.elapsedMs }, status: 200 }
    : failure(result.code, result.message, result.status);
}
