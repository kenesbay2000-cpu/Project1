import { isRetryablePlannerError, largePlanWaitError, readPlannerFunctionError } from './aiPlannerErrors';
import type { GenerationProgress, PlannerLanguage, PlannerRequest, TripPlan } from './aiPlannerTypes';
import { supabase } from './supabase';

type TripPlanCore = Omit<TripPlan, 'days'>;
type CoreResponse = { core?: TripPlanCore; error?: { message?: string } };
type DaysResponse = { days?: TripPlan['days']; error?: { message?: string } };
type PlanResponse = { plan?: TripPlan; error?: { message?: string } };

function requestDayCount(request: PlannerRequest) {
  if (request.confirmedSummary?.durationDays) return request.confirmedSummary.durationDays;
  if (!request.dates) return 7;
  return Math.round((Date.parse(`${request.dates.end}T00:00:00Z`) - Date.parse(`${request.dates.start}T00:00:00Z`)) / 86_400_000) + 1;
}

export function shouldChunkTripPlan(request: PlannerRequest) {
  const days = requestDayCount(request);
  const travelers = request.travelers ?? request.confirmedSummary?.travelers.count ?? 1;
  return days >= 10 || travelers >= 8 || days * Math.max(1, Math.ceil(travelers / 4)) >= 28;
}

function partClientTimeout(dayCount: number, travelers: number, isCore = false) {
  const groupExtra = travelers >= 8 ? 10_000 : travelers >= 4 ? 5_000 : 0;
  return Math.min(148_000, (isCore ? 135_000 : 95_000 + dayCount * 10_000) + groupExtra);
}

async function invokePart<T>(body: object, timeout: number, language: PlannerLanguage): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { data, error } = await supabase.functions.invoke<T>('ai', { body, timeout });
    if (!error && data) return data;
    if (attempt === 0 && isRetryablePlannerError(error)) continue;
    if (isRetryablePlannerError(error)) throw new Error(largePlanWaitError(language));
    throw new Error(await readPlannerFunctionError(error, language));
  }
  throw new Error(largePlanWaitError(language));
}

export async function generateChunkedTripPlan(request: PlannerRequest, onProgress?: (progress: GenerationProgress) => void) {
  const language = request.responseLanguage ?? 'ru';
  const dayCount = requestDayCount(request);
  const travelers = request.travelers ?? request.confirmedSummary?.travelers.count ?? 1;
  const chunkSize = 4;
  const total = Math.ceil(dayCount / chunkSize) + 2;
  onProgress?.({ mode: 'chunked', phase: 'preparing', completed: 0, total });
  const coreData = await invokePart<CoreResponse>({ mode: 'generate_core', request }, partClientTimeout(0, travelers, true), language);
  if (!coreData.core) throw new Error(coreData.error?.message ?? largePlanWaitError(language));

  const days: TripPlan['days'] = [];
  for (let startDay = 1; startDay <= dayCount; startDay += chunkSize) {
    const endDay = Math.min(dayCount, startDay + chunkSize - 1);
    onProgress?.({ mode: 'chunked', phase: 'days', completed: 1 + days.length / chunkSize, total, startDay, endDay });
    const dayData = await invokePart<DaysResponse>({
      mode: 'generate_days', request, core: coreData.core, startDay, endDay, previousDay: days[days.length - 1],
    }, partClientTimeout(endDay - startDay + 1, travelers), language);
    if (!dayData.days) throw new Error(dayData.error?.message ?? largePlanWaitError(language));
    days.push(...dayData.days);
  }

  onProgress?.({ mode: 'chunked', phase: 'finalizing', completed: total - 1, total });
  const finalized = await invokePart<PlanResponse>({ mode: 'finalize_plan', request, core: coreData.core, days }, 45_000, language);
  if (!finalized.plan) throw new Error(finalized.error?.message ?? largePlanWaitError(language));
  return finalized.plan;
}
