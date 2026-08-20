import { isSupabaseConfigured, supabase } from './supabase';
import type { PreferenceCandidate, TravelPreference } from './travelPreferences';
import { plannerConfigError, readPlannerFunctionError } from './aiPlannerErrors';

export type PlannerLanguage = 'ru' | 'en' | 'kk';

export type PlannerRequest = {
  prompt: string;
  responseLanguage?: PlannerLanguage;
  originCity?: string;
  dates?: { start: string; end: string };
  travelers?: number;
  travelerAges?: number[];
  priceRange?: { min: number; max: number; currency: string };
  clarifications?: ClarificationTurn[];
  summaryCorrections?: string[];
  confirmedSummary?: TripSummary;
  routeEdits?: string[];
  savedPreferences?: string[];
};

export type ClarificationQuestion = { id: string; text: string };
export type ClarificationTurn = { questions: ClarificationQuestion[]; answer: string };
export type ClarificationResult = {
  status: 'questions' | 'ready';
  message: string;
  originCity?: string;
  questions: ClarificationQuestion[];
};

export type TripSummary = {
  destination: string;
  originCity: string;
  dates: { start: string; end: string };
  durationDays: number;
  travelers: { count: number; ages: number[]; description: string };
  budget: { min: number; max: number; currency: string };
  interests: string[];
  pace: string;
  lodging: string;
  transport: string;
  constraints: string[];
  otherDetails: string[];
};

export type GeneratedTrip = {
  id: string;
  request: PlannerRequest;
  plan: TripPlan;
};

export type RecommendationTier = 'budget' | 'comfortable' | 'luxury';

export type TripPlan = {
  title: string;
  destination: { city: string; country: string };
  days: Array<{
    day: number;
    title: string;
    activities: Array<{
      time: string;
      title: string;
      place: string;
      area: string;
      description: string;
      estimatedCost: number;
      durationMinutes: number;
      travelMinutesFromPrevious: number;
    }>;
    date: string;
    pace: 'active' | 'balanced' | 'rest';
  }>;
  placeIdeas: Array<{ name: string; type: string; description: string }>;
  budget: {
    currency: string;
    total: number;
    categories: Array<{ category: string; amount: number; note: string }>;
  };
  transport: Array<{ mode: string; route: string; recommendation: string }>;
  accommodations: Array<{
    name: string;
    area: string;
    type: string;
    pricePerNight: number;
    description: string;
    tier?: RecommendationTier;
  }>;
  food: Array<{ name: string; cuisine: string; priceLevel: string; description: string; tier?: RecommendationTier }>;
  activities: Array<{ name: string; category: string; summary: string; tier?: RecommendationTier }>;
  usefulLinks: Array<{ title: string; recommendation: string }>;
  checklist: Array<{ task: string; timing: string; details: string }>;
  realism: {
    status: 'realistic' | 'adjusted';
    warning: string;
    adjustments: string[];
  };
  rationale: string;
};

type PlannerResponse = { plan?: TripPlan; error?: { message?: string } };
type ClarificationResponse = { clarification?: ClarificationResult; error?: { message?: string } };
type SummaryResponse = { summary?: TripSummary; error?: { message?: string } };
type EditResponse = { plan?: TripPlan; request?: PlannerRequest; error?: { message?: string } };
type PreferenceResponse = { candidates?: PreferenceCandidate[]; error?: { message?: string } };

export async function generateTripPlan(request: PlannerRequest) {
  const language = request.responseLanguage ?? 'ru';
  if (!isSupabaseConfigured) {
    throw new Error(plannerConfigError(language));
  }

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
