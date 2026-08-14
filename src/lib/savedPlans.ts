import { supabase } from './supabase';
import type { GeneratedTrip } from './aiPlanner';

const PENDING_PLAN_KEY = 'roamly.pending-plan';
const PENDING_PLAN_LIFETIME = 24 * 60 * 60 * 1000;

type PendingPlan = {
  expiresAt: number;
  trip: GeneratedTrip;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isGeneratedTrip(value: unknown): value is GeneratedTrip {
  return isRecord(value) && typeof value.id === 'string'
    && isRecord(value.request) && typeof value.request.prompt === 'string'
    && isRecord(value.plan) && typeof value.plan.title === 'string';
}

export function storePendingTrip(trip: GeneratedTrip) {
  const pending: PendingPlan = { expiresAt: Date.now() + PENDING_PLAN_LIFETIME, trip };
  window.localStorage.setItem(PENDING_PLAN_KEY, JSON.stringify(pending));
}

export function getPendingTrip() {
  const raw = window.localStorage.getItem(PENDING_PLAN_KEY);
  if (!raw) return null;
  try {
    const pending: unknown = JSON.parse(raw);
    if (!isRecord(pending) || typeof pending.expiresAt !== 'number'
      || pending.expiresAt < Date.now() || !isGeneratedTrip(pending.trip)) {
      clearPendingTrip();
      return null;
    }
    return pending.trip;
  } catch {
    clearPendingTrip();
    return null;
  }
}

export function clearPendingTrip() {
  window.localStorage.removeItem(PENDING_PLAN_KEY);
}

export function hasPendingTrip() {
  return Boolean(getPendingTrip());
}

export async function saveTripPlan(trip: GeneratedTrip, userId: string) {
  const { request, plan } = trip;
  const days = plan.days.length;
  const destination = [plan.destination.city, plan.destination.country].filter(Boolean).join(', ');
  const { error } = await supabase.from('travel_plans').upsert({
    client_id: trip.id,
    user_id: userId,
    title: plan.title,
    destination,
    destination_country: plan.destination.country,
    origin_city: request.originCity ?? null,
    start_date: request.dates?.start ?? null,
    end_date: request.dates?.end ?? null,
    travelers: request.travelers ?? 1,
    days,
    nights: Math.max(0, days - 1),
    budget_min: request.priceRange?.min ?? plan.budget.total,
    budget_max: request.priceRange?.max ?? plan.budget.total,
    currency: plan.budget.currency.slice(0, 3).toUpperCase(),
    itinerary: plan,
    planner_request: request,
    status: 'planned',
  }, { onConflict: 'user_id,client_id' });
  if (error) throw error;
}

export function getSavePlanError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (message.includes('jwt') || message.includes('session')) return 'Сессия завершилась. Войдите снова — готовый маршрут сохранён и не потеряется.';
  if (message.includes('fetch') || message.includes('network')) return 'Не удалось связаться с сервером. Проверьте интернет и попробуйте ещё раз.';
  return 'Не удалось сохранить план. Попробуйте ещё раз через несколько секунд.';
}
