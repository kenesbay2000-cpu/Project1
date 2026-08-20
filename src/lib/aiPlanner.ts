import { isSupabaseConfigured, supabase } from './supabase';
import type { PreferenceCandidate, TravelPreference } from './travelPreferences';
import { plannerConfigError, readPlannerFunctionError } from './aiPlannerErrors';
import { generateChunkedTripPlan, shouldChunkTripPlan } from './largeTripGeneration';
import type { ClarificationResult, GeneratedTrip, GenerationProgress, PlannerLanguage, PlannerRequest, TripPlan, TripSummary } from './aiPlannerTypes';

export type { ClarificationQuestion, ClarificationResult, ClarificationTurn, GeneratedTrip, GenerationProgress, PlannerLanguage, PlannerRequest, RecommendationTier, TripPlan, TripSummary } from './aiPlannerTypes';

type PlannerResponse = { plan?: TripPlan; error?: { message?: string } };
type ClarificationResponse = { clarification?: ClarificationResult; error?: { message?: string } };
type SummaryResponse = { summary?: TripSummary; error?: { message?: string } };
type EditResponse = { plan?: TripPlan; request?: PlannerRequest; error?: { message?: string } };
type PreferenceResponse = { candidates?: PreferenceCandidate[]; error?: { message?: string } };
export async function generateTripPlan(request: PlannerRequest, onProgress?: (progress: GenerationProgress) => void) {
  const language = request.responseLanguage ?? 'ru';
  if (!isSupabaseConfigured) {
    throw new Error(plannerConfigError(language));
  }

  if (shouldChunkTripPlan(request)) return generateChunkedTripPlan(request, onProgress);
  onProgress?.({ mode: 'standard', phase: 'preparing', completed: 0, total: 6 });
  const { data, error } = await supabase.functions.invoke<PlannerResponse>('ai', {
    body: request,
    timeout: 155_000,
  });

  if (error) throw new Error(await readPlannerFunctionError(error, language));
  if (!data?.plan) throw new Error(data?.error?.message ?? await readPlannerFunctionError(null, language));
  return data.plan;
}

export async function analyzeTripRequest(request: PlannerRequest) {
  const language = request.responseLanguage ?? 'ru';
  if (!isSupabaseConfigured) throw new Error(plannerConfigError(language));

  const { data, error } = await supabase.functions.invoke<ClarificationResponse>('ai', {
    body: { mode: 'clarify', request },
    timeout: 45_000,
  });
  if (error) throw new Error(await readPlannerFunctionError(error, language));
  if (!data?.clarification) throw new Error(data?.error?.message ?? await readPlannerFunctionError(null, language));
  return data.clarification;
}

export async function summarizeTripRequest(request: PlannerRequest, currentSummary?: TripSummary, correction?: string) {
  const language = request.responseLanguage ?? 'ru';
  if (!isSupabaseConfigured) throw new Error(plannerConfigError(language));

  const { data, error } = await supabase.functions.invoke<SummaryResponse>('ai', {
    body: { mode: 'summarize', request, currentSummary, correction },
    timeout: 45_000,
  });
  if (error) throw new Error(await readPlannerFunctionError(error, language));
  if (!data?.summary) throw new Error(data?.error?.message ?? await readPlannerFunctionError(null, language));
  return data.summary;
}

export async function extractTravelPreferences(request: PlannerRequest, known: TravelPreference[]) {
  const language = request.responseLanguage ?? 'ru';
  const { data, error } = await supabase.functions.invoke<PreferenceResponse>('ai', {
    body: {
      mode: 'learn_preferences',
      request,
      known: known.slice(0, 20).map((item) => ({ key: item.key, label: item.label })),
    },
    timeout: 30_000,
  });
  if (error) throw new Error(await readPlannerFunctionError(error, language));
  return data?.candidates ?? [];
}

export async function editTripPlan(trip: GeneratedTrip, command: string, responseLanguage: PlannerLanguage): Promise<GeneratedTrip> {
  if (!isSupabaseConfigured) throw new Error(plannerConfigError(responseLanguage));
  const { data, error } = await supabase.functions.invoke<EditResponse>('ai', {
    body: { mode: 'edit', request: { ...trip.request, responseLanguage }, plan: trip.plan, command },
    timeout: 155_000,
  });
  if (error) throw new Error(await readPlannerFunctionError(error, responseLanguage));
  if (!data?.plan || !data.request) throw new Error(data?.error?.message ?? await readPlannerFunctionError(null, responseLanguage));
  return { ...trip, request: data.request, plan: data.plan };
}
