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

type SavedRow = { id: string; user_id: string; client_id: string };

function validateTripForSave(trip: GeneratedTrip) {
  const { request, plan } = trip;
  if (!isGeneratedTrip(trip) || !plan.destination?.city.trim() || !plan.destination.country.trim()
    || plan.days.length < 1 || plan.days.length > 90 || !Number.isFinite(plan.budget.total)
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
  const days = plan.days.length;
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

export function getSavePlanError(error: unknown) {
  const details = error as { code?: string; message?: string; details?: string };
  const message = details.message?.toLowerCase() ?? '';
  if (details.message === 'SAVE_AUTH_REQUIRED' || message.includes('jwt') || message.includes('session')) {
    return 'Сессия завершилась. Войдите снова — готовый маршрут останется на экране.';
  }
  if (details.message === 'SAVE_INVALID_PLAN') return 'Маршрут содержит неполные данные и не может быть сохранён. Создайте план ещё раз.';
  if (details.message === 'SAVE_NOT_CONFIRMED') return 'Сервер не подтвердил сохранение. Нажмите «Сохранить план» ещё раз.';
  if (details.code === '42501' || details.code === 'PGRST301') return 'Supabase отклонил запись из-за доступа. Выйдите из аккаунта, войдите снова и повторите сохранение.';
  if (details.code === '23514' || details.code === '22003' || details.code === '22001') return 'Некоторые значения маршрута не подходят формату базы. Измените параметры поездки и создайте план заново.';
  if (details.code === 'PGRST204' || details.code === '42703') return 'Структура базы не совпадает с приложением. Обновите страницу и попробуйте снова.';
  if (message.includes('fetch') || message.includes('network')) return 'Не удалось связаться с сервером. Проверьте интернет и попробуйте ещё раз.';
  return details.code
    ? `Не удалось сохранить план (код ${details.code}). Попробуйте ещё раз или сообщите этот код разработчику.`
    : 'Не удалось сохранить план по неизвестной причине. Попробуйте ещё раз через несколько секунд.';
}
