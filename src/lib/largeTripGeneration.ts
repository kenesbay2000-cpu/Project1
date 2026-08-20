import { isRetryablePlannerError, largePlanWaitError, readPlannerFunctionError } from './aiPlannerErrors';
import type { DeferredPlanSection, GeneratedTrip, GenerationProgress, PlannerLanguage, PlannerRequest, TripPlan } from './aiPlannerTypes';
import { supabase } from './supabase';
import { buildDestinationChunks } from './tripDestinations';

type TripPlanCore = Omit<TripPlan, 'days'>;
type CoreResponse = { core?: TripPlanCore; error?: { message?: string } };
type DaysResponse = { days?: TripPlan['days']; warnings?: TripPlan['travelDataWarnings']; error?: { message?: string } };
type SectionResponse = { section?: DeferredPlanSection; items?: unknown[]; warnings?: TripPlan['travelDataWarnings']; error?: { message?: string } };

export const DEFERRED_PLAN_SECTIONS: DeferredPlanSection[] = [
  'itinerary', 'accommodations', 'food', 'activities', 'usefulLinks', 'checklist',
];

export function requestDayCount(request: PlannerRequest) {
  if (request.confirmedSummary?.durationDays) return request.confirmedSummary.durationDays;
  if (!request.dates) return 7;
  return Math.round((Date.parse(`${request.dates.end}T00:00:00Z`) - Date.parse(`${request.dates.start}T00:00:00Z`)) / 86_400_000) + 1;
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
    if (isRetryablePlannerError(error)) {
      const hasServerResponse = typeof error === 'object' && error !== null
        && 'context' in error && error.context instanceof Response;
      throw new Error(hasServerResponse ? await readPlannerFunctionError(error, language) : largePlanWaitError(language));
    }
    throw new Error(await readPlannerFunctionError(error, language));
  }
  throw new Error(largePlanWaitError(language));
}

export async function generateChunkedTripPlan(request: PlannerRequest, onProgress?: (progress: GenerationProgress) => void) {
  const language = request.responseLanguage ?? 'ru';
  const travelers = request.travelers ?? request.confirmedSummary?.travelers.count ?? 1;
  onProgress?.({ mode: 'chunked', phase: 'preparing', completed: 0, total: 1 });
  const coreData = await invokePart<CoreResponse>({ mode: 'generate_core', overviewOnly: true, request }, partClientTimeout(0, travelers, true), language);
  if (!coreData.core) throw new Error(coreData.error?.message ?? largePlanWaitError(language));
  return { ...coreData.core, days: [] };
}

function completeSection(trip: GeneratedTrip, section: DeferredPlanSection, plan: TripPlan): GeneratedTrip {
  return {
    ...trip,
    plan,
    request: { ...trip.request, deferredSections: (trip.request.deferredSections ?? []).filter((item) => item !== section) },
  };
}

function mergeWarnings(plan: TripPlan, section: DeferredPlanSection, warnings: TripPlan['travelDataWarnings']) {
  const warningSection = section === 'itinerary' ? 'itinerary' : section;
  const kept = (plan.travelDataWarnings ?? []).filter((warning) => warning.section !== warningSection);
  return { ...plan, travelDataWarnings: [...kept, ...(warnings ?? [])] };
}

export async function generateDeferredTripSection(trip: GeneratedTrip, section: DeferredPlanSection): Promise<GeneratedTrip> {
  if (!(trip.request.deferredSections ?? []).includes(section)) return trip;
  const language = trip.request.responseLanguage ?? 'ru';
  const travelers = trip.request.travelers ?? trip.request.confirmedSummary?.travelers.count ?? 1;
  if (section === 'itinerary') {
    const days: TripPlan['days'] = [];
    const warnings: NonNullable<TripPlan['travelDataWarnings']> = [];
    const count = trip.request.expectedDays ?? requestDayCount(trip.request);
    const chunks = buildDestinationChunks(trip.request, trip.plan.destination, count);
    for (const chunk of chunks) {
      const { startDay, endDay } = chunk;
      const data = await invokePart<DaysResponse>({
        mode: 'generate_days', request: trip.request, core: trip.plan, startDay, endDay,
        destination: { city: chunk.city, country: chunk.country, clusterIndex: chunk.clusterIndex, clusterCount: chunk.clusterCount },
        previousDay: days[days.length - 1],
      }, partClientTimeout(endDay - startDay + 1, travelers), language);
      if (!data.days) throw new Error(data.error?.message ?? largePlanWaitError(language));
      days.push(...data.days);
      warnings.push(...(data.warnings ?? []));
    }
    return completeSection(trip, section, mergeWarnings({ ...trip.plan, days }, section, warnings));
  }
  const data = await invokePart<SectionResponse>({ mode: 'generate_section', request: trip.request, core: trip.plan, section }, 110_000, language);
  if (!data.items) throw new Error(data.error?.message ?? largePlanWaitError(language));
  const plan = { ...trip.plan, [section]: data.items } as TripPlan;
  return completeSection(trip, section, mergeWarnings(plan, section, data.warnings));
}
