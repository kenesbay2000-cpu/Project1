import { isSupabaseConfigured, supabase } from './supabase';

export type PlannerRequest = {
  prompt: string;
  originCity?: string;
  dates?: { start: string; end: string };
  travelers?: number;
  travelerAges?: number[];
  priceRange?: { min: number; max: number; currency: string };
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
      description: string;
      estimatedCost: number;
    }>;
  }>;
  placeIdeas: Array<{ name: string; type: string; description: string }>;
  budget: {
    currency: string;
    total: number;
    categories: Array<{ category: string; amount: number; note: string }>;
  };
  rationale: string;
};

type PlannerResponse = { plan?: TripPlan; error?: { message?: string } };

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
  });

  if (error) throw new Error(await readFunctionError(error));
  if (!data?.plan) throw new Error(data?.error?.message ?? fallbackError);
  return data.plan;
}
