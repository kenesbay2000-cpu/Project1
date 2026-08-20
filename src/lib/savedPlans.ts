import { supabase } from './supabase';
import type { GeneratedTrip } from './aiPlanner';
import type { TranslationKey } from '../i18n/translations';

type Translate = (key: TranslationKey, values?: Record<string, string | number>) => string;

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

type SavedRow = { id: string; user_id: string; client_id: string };

function validateTripForSave(trip: GeneratedTrip) {
  const { request, plan } = trip;
  const savedDayCount = request.expectedDays ?? plan.days.length;
  if (!isGeneratedTrip(trip) || !plan.destination?.city.trim() || !plan.destination.country.trim()
    || savedDayCount < 1 || savedDayCount > 90 || !Number.isFinite(plan.budget.total)
    || plan.budget.total < 0 || !plan.budget.currency.trim()) {
    throw new Error('SAVE_INVALID_PLAN');
  }
  if (request.travelers && (request.travelers < 1 || request.travelers > 30)) {
    throw new Error('SAVE_INVALID_PLAN');
  }
  if (request.dates && request.dates.start > request.dates.end) throw new Error('SAVE_INVALID_PLAN');
}

export async function saveTripPlan(trip: GeneratedTrip) {
  validateTripForSave(trip);
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new Error('SAVE_AUTH_REQUIRED');

  const { request, plan } = trip;
  const days = request.expectedDays ?? plan.days.length;
  const destination = [plan.destination.city, plan.destination.country].filter(Boolean).join(', ');
  const { data, error } = await supabase.from('travel_plans').upsert({
    client_id: trip.id,
    user_id: authData.user.id,
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
  }, { onConflict: 'user_id,client_id' })
    .select('id,user_id,client_id')
    .single();
  if (error) throw error;
  const saved = data as unknown as SavedRow | null;
  if (!saved || saved.user_id !== authData.user.id || saved.client_id !== trip.id) {
    throw new Error('SAVE_NOT_CONFIRMED');
  }
  return saved.id;
}

export function getSavePlanError(error: unknown, t: Translate) {
  const details = error as { code?: string; message?: string; details?: string };
  const message = details.message?.toLowerCase() ?? '';
  if (details.message === 'SAVE_AUTH_REQUIRED' || message.includes('jwt') || message.includes('session')) {
    return t('save.sessionError');
  }
  if (details.message === 'SAVE_INVALID_PLAN') return t('save.invalidError');
  if (details.message === 'SAVE_NOT_CONFIRMED') return t('save.unconfirmedError');
  if (details.code === '42501' || details.code === 'PGRST301') return t('save.accessError');
  if (details.code === '23514' || details.code === '22003' || details.code === '22001') return t('save.formatError');
  if (details.code === 'PGRST204' || details.code === '42703') return t('save.schemaError');
  if (message.includes('fetch') || message.includes('network')) return t('save.networkError');
  return details.code
    ? t('save.codeError', { code: details.code })
    : t('save.unknownError');
}
