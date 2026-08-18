import { isSupabaseConfigured, supabase } from './supabase';

export type PlannerRequest = {
  prompt: string;
  originCity?: string;
  dates?: { start: string; end: string };
  travelers?: number;
  travelerAges?: number[];
  priceRange?: { min: number; max: number; currency: string };
  clarifications?: ClarificationTurn[];
  summaryCorrections?: string[];
  confirmedSummary?: TripSummary;
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
  }>;
  food: Array<{ name: string; cuisine: string; priceLevel: string; description: string }>;
  activities: Array<{ name: string; category: string; summary: string }>;
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

const fallbackError = 'Не удалось определить причину сбоя. Проверьте данные и попробуйте создать маршрут ещё раз.';

async function readFunctionError(error: unknown) {
  if (typeof error === 'object' && error !== null && 'context' in error) {
    const context = error.context;
    if (context instanceof Response) {
      const body = await context.clone().json().catch(() => null) as PlannerResponse | null;
      if (body?.error?.message) return body.error.message;
    }
  }
  return fallbackError;
}

export async function generateTripPlan(request: PlannerRequest) {
  if (!isSupabaseConfigured) {
    throw new Error('AI Planner пока не настроен. Проверьте настройки Supabase.');
  }

  const { data, error } = await supabase.functions.invoke<PlannerResponse>('ai', {
    body: request,
    timeout: 155_000,
  });

  if (error) throw new Error(await readFunctionError(error));
  if (!data?.plan) throw new Error(data?.error?.message ?? fallbackError);
  return data.plan;
}

export async function analyzeTripRequest(request: PlannerRequest) {
  if (!isSupabaseConfigured) throw new Error('AI Planner пока не настроен. Проверьте настройки Supabase.');

  const { data, error } = await supabase.functions.invoke<ClarificationResponse>('ai', {
    body: { mode: 'clarify', request },
    timeout: 45_000,
  });
  if (error) throw new Error(await readFunctionError(error));
  if (!data?.clarification) throw new Error(data?.error?.message ?? fallbackError);
  return data.clarification;
}

export async function summarizeTripRequest(request: PlannerRequest, currentSummary?: TripSummary, correction?: string) {
  if (!isSupabaseConfigured) throw new Error('AI Planner пока не настроен. Проверьте настройки Supabase.');

  const { data, error } = await supabase.functions.invoke<SummaryResponse>('ai', {
    body: { mode: 'summarize', request, currentSummary, correction },
    timeout: 45_000,
  });
  if (error) throw new Error(await readFunctionError(error));
  if (!data?.summary) throw new Error(data?.error?.message ?? fallbackError);
  return data.summary;
}
