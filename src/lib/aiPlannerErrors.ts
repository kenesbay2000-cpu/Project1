import type { PlannerLanguage } from './aiPlannerTypes';

export type PlannerErrorScope = 'planner' | 'overview' | 'itinerary' | 'section';
export type PlannerErrorBody = { code?: string; message?: string };
type FunctionErrorBody = { error?: PlannerErrorBody };

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

function genericError(language: PlannerLanguage, scope: PlannerErrorScope) {
  if (scope === 'overview') return localText(language, 'Не удалось подготовить обзор поездки. Попробуйте ещё раз.', 'The trip overview could not be prepared. Please try again.', 'Сапар шолуын дайындай алмадық. Қайталап көріңіз.');
  if (scope === 'itinerary') return localText(language, 'Не удалось собрать часть маршрута. Попробуйте ещё раз.', 'Part of the itinerary could not be prepared. Please try again.', 'Маршруттың бір бөлігін дайындай алмадық. Қайталап көріңіз.');
  if (scope === 'section') return localText(language, 'Не удалось подготовить этот раздел. Попробуйте ещё раз.', 'This section could not be prepared. Please try again.', 'Бұл бөлімді дайындай алмадық. Қайталап көріңіз.');
  return localText(language, 'Не удалось подготовить маршрут. Проверьте данные и попробуйте ещё раз.', 'The itinerary could not be prepared. Review the details and try again.', 'Маршрутты дайындай алмадық. Мәліметтерді тексеріп, қайталап көріңіз.');
}

export function safePlannerError(error: PlannerErrorBody | undefined, language: PlannerLanguage, scope: PlannerErrorScope = 'planner') {
  if (error?.code === 'BUDGET_TOO_LOW') return localText(language, 'Бюджет слишком низкий для этой поездки. Увеличьте его или сократите поездку.', 'The budget is too low for this trip. Increase it or shorten the trip.', 'Бұл сапар үшін бюджет тым төмен. Оны көбейтіңіз немесе сапарды қысқартыңыз.');
  if (error?.code === 'PROTECTED_INFORMATION') return localText(language, 'Этот запрос содержит данные, которые нельзя обрабатывать. Уберите личную или секретную информацию.', 'This request contains information that cannot be processed. Remove personal or secret data.', 'Бұл сұрауда өңдеуге болмайтын деректер бар. Жеке немесе құпия ақпаратты алып тастаңыз.');
  if (error?.code === 'AI_NOT_CONFIGURED') return plannerConfigError(language);
  if (error?.code === 'EXCHANGE_RATES_UNAVAILABLE' || error?.code === 'AI_UNAVAILABLE' || error?.code === 'AI_TIMEOUT') {
    return localText(language, 'Сервис временно недоступен. Попробуйте ещё раз немного позже.', 'The service is temporarily unavailable. Please try again shortly.', 'Сервис уақытша қолжетімсіз. Сәл кейінірек қайталап көріңіз.');
  }
  if (error?.code === 'UNREALISTIC_AI_PLAN') return localText(language, 'Не удалось собрать реалистичный маршрут. Измените сроки или сократите число мест и попробуйте ещё раз.', 'A realistic itinerary could not be prepared. Adjust the dates or reduce the number of places and try again.', 'Шынайы маршрут құра алмадық. Күндерді өзгертіңіз немесе орындар санын азайтып, қайталап көріңіз.');
  return genericError(language, scope);
}

export function isRetryablePlannerError(error: unknown) {
  if (typeof error !== 'object' || error === null) return false;
  if ('context' in error && error.context instanceof Response) return error.context.status >= 500;
  const message = 'message' in error && typeof error.message === 'string' ? error.message.toLowerCase() : '';
  return message.includes('timeout') || message.includes('timed out') || message.includes('abort') || message.includes('fetch');
}

export async function readPlannerFunctionError(error: unknown, language: PlannerLanguage, scope: PlannerErrorScope = 'planner') {
  if (typeof error === 'object' && error !== null && 'context' in error) {
    const context = error.context;
    if (context instanceof Response) {
      const body = await context.clone().json().catch(() => null) as FunctionErrorBody | null;
      if (body?.error) return safePlannerError(body.error, language, scope);
    }
  }
  return genericError(language, scope);
}
