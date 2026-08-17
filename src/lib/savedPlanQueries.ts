import type { GeneratedTrip } from './aiPlanner';
import { isGeneratedTrip } from './savedPlans';
import { supabase } from './supabase';

export type SavedPlanSummary = {
  id: string;
  title: string;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  days: number;
  budget: number | null;
  currency: string;
  createdAt: string;
};

type SummaryRow = {
  id: string;
  title: string | null;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  days: number;
  budget_max: number | string | null;
  currency: string;
  created_at: string;
};

type DetailRow = {
  id: string;
  client_id: string;
  title: string | null;
  itinerary: unknown;
  planner_request: unknown;
};

export async function loadSavedPlans(userId: string): Promise<SavedPlanSummary[]> {
  const { data, error } = await supabase.from('travel_plans')
    .select('id,title,destination,start_date,end_date,days,budget_max,currency,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const rows = data as unknown as SummaryRow[];
  return rows.map((row) => ({
    id: row.id,
    title: row.title?.trim() || row.destination,
    destination: row.destination,
    startDate: row.start_date,
    endDate: row.end_date,
    days: row.days,
    budget: row.budget_max === null ? null : Number(row.budget_max),
    currency: row.currency.trim(),
    createdAt: row.created_at,
  }));
}

export async function loadSavedPlan(id: string, userId: string): Promise<GeneratedTrip | null> {
  const { data, error } = await supabase.from('travel_plans')
    .select('id,client_id,title,itinerary,planner_request')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as DetailRow;
  const savedRequest = typeof row.planner_request === 'object' && row.planner_request !== null
    && 'prompt' in row.planner_request && typeof row.planner_request.prompt === 'string'
    ? row.planner_request
    : { prompt: '' };
  const trip: unknown = { id: row.client_id, request: savedRequest, plan: row.itinerary };
  if (!isGeneratedTrip(trip)) throw new Error('INVALID_SAVED_PLAN');
  return row.title?.trim() ? { ...trip, plan: { ...trip.plan, title: row.title.trim() } } : trip;
}

export async function renameSavedPlan(id: string, userId: string, title: string) {
  const normalizedTitle = title.trim();
  if (!normalizedTitle || normalizedTitle.length > 100) throw new Error('INVALID_TITLE');
  const { data, error } = await supabase.from('travel_plans').update({ title: normalizedTitle })
    .eq('id', id).eq('user_id', userId).select('id').maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('PLAN_NOT_FOUND');
}

export async function deleteSavedPlan(id: string, userId: string) {
  const { data, error } = await supabase.from('travel_plans').delete()
    .eq('id', id).eq('user_id', userId).select('id').maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('PLAN_NOT_FOUND');
}

export function getPlansError(action: 'load' | 'rename' | 'delete', error: unknown) {
  if (error instanceof Error && error.message === 'INVALID_TITLE') return 'Название должно содержать от 1 до 100 символов.';
  if (error instanceof Error && error.message === 'INVALID_SAVED_PLAN') return 'Сохранённый маршрут повреждён и не может быть открыт.';
  if (error instanceof Error && error.message === 'PLAN_NOT_FOUND') return 'Поездка не найдена или у вас больше нет к ней доступа.';
  if (action === 'rename') return 'Не удалось переименовать поездку. Попробуйте ещё раз.';
  if (action === 'delete') return 'Не удалось удалить поездку. Попробуйте ещё раз.';
  return 'Не удалось загрузить сохранённые поездки. Проверьте интернет и повторите попытку.';
}
