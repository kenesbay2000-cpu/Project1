import type { PlannerLanguage } from './aiPlanner';

type FunctionErrorBody = { error?: { message?: string } };

function localText(language: PlannerLanguage, ru: string, en: string, kk: string) {
  return language === 'en' ? en : language === 'kk' ? kk : ru;
}

export function plannerConfigError(language: PlannerLanguage) {
  return localText(language, 'AI Planner пока не настроен. Проверьте настройки Supabase.', 'AI Planner is not configured yet. Check the Supabase settings.', 'AI Planner әлі бапталмаған. Supabase баптауларын тексеріңіз.');
}

export async function readPlannerFunctionError(error: unknown, language: PlannerLanguage) {
  if (typeof error === 'object' && error !== null && 'context' in error) {
    const context = error.context;
    if (context instanceof Response) {
      const body = await context.clone().json().catch(() => null) as FunctionErrorBody | null;
      if (body?.error?.message) return body.error.message;
    }
  }
  return localText(language, 'Не удалось определить причину сбоя. Проверьте данные и попробуйте создать маршрут ещё раз.', 'We couldn’t identify the cause of the issue. Review the details and try creating the itinerary again.', 'Ақау себебін анықтай алмадық. Мәліметтерді тексеріп, маршрутты қайта құрып көріңіз.');
}
