import type { PlannerLanguage } from './aiPlannerTypes';

type FunctionErrorBody = { error?: { message?: string } };

function localText(language: PlannerLanguage, ru: string, en: string, kk: string) {
  return language === 'en' ? en : language === 'kk' ? kk : ru;
}

export function plannerConfigError(language: PlannerLanguage) {
  return localText(language, 'AI Planner пока не настроен. Проверьте настройки Supabase.', 'AI Planner is not configured yet. Check the Supabase settings.', 'AI Planner әлі бапталмаған. Supabase баптауларын тексеріңіз.');
}

export function largePlanWaitError(language: PlannerLanguage) {
  return localText(
    language,
    'Этот запрос особенно объёмный. AI Planner уже выделил для него дополнительное время, но один из блоков всё ещё не успел завершиться. Попробуйте продолжить генерацию ещё раз — крупный план может потребовать больше времени.',
    'This is an especially detailed request. AI Planner allowed extra time, but one section still could not finish. Try generating once more — a large itinerary may need a little longer.',
    'Бұл өте көлемді сұрау. AI Planner қосымша уақыт бөлді, бірақ бөлімдердің бірі әлі аяқталмады. Қайта құрып көріңіз — үлкен жоспарға көбірек уақыт қажет болуы мүмкін.',
  );
}

export function isRetryablePlannerError(error: unknown) {
  if (typeof error !== 'object' || error === null) return false;
  if ('context' in error && error.context instanceof Response) return error.context.status >= 500;
  const message = 'message' in error && typeof error.message === 'string' ? error.message.toLowerCase() : '';
  return message.includes('timeout') || message.includes('timed out') || message.includes('abort') || message.includes('fetch');
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
