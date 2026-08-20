import { budgetPromptGuidance, assessBudget } from './budgetPolicy.ts';
import type { CurrencyRates } from './exchangeRates.ts';
import { requestGemini, type GeminiResult } from './gemini.ts';
import { RECOMMENDATION_SAFETY_GUIDANCE } from './recommendationSafety.ts';
import { localizedPlannerText, responseLanguageInstruction } from './responseLanguage.ts';
import {
  parseTripDaysText, parseTripPlanCoreText, parseTripPlanOverviewText,
  TRIP_DAYS_SCHEMA, TRIP_PLAN_CORE_SCHEMA, TRIP_PLAN_OVERVIEW_SCHEMA, type TripPlanCore,
} from './tripPlanParts.ts';
import type { PlannerRequest, TripDay } from './types.ts';
import {
  destinationOf, hasGroundedDayPlaces, loadPlaceGrounding,
} from './travelDataGrounding.ts';

type Failure = Extract<GeminiResult, { ok: false }> | {
  ok: false;
  code: 'INCOMPLETE_AI_PLAN' | 'TRAVEL_DATA_UNAVAILABLE';
  message: string;
  status: 502 | 503;
};
export type PartResult<T> = Failure | { ok: true; value: T; elapsedMs: number };

export function requestContext(request: PlannerRequest, rates: CurrencyRates) {
  const summary = request.confirmedSummary ? JSON.stringify(request.confirmedSummary) : 'нет';
  const preferences = request.savedPreferences?.length ? request.savedPreferences.join('; ') : 'нет';
  return `${responseLanguageInstruction(request)}
Подтверждённая сводка: ${summary}
Исходный запрос: ${request.prompt}
Город вылета: ${request.originCity ?? 'не указан'}
Даты: ${request.dates ? `${request.dates.start} — ${request.dates.end}` : 'не указаны'}
Путешественников: ${request.travelers ?? 1}
Возраст: ${request.travelerAges?.join(', ') || 'не указан'}
Бюджет: ${request.priceRange ? `${request.priceRange.min}–${request.priceRange.max} ${request.priceRange.currency}` : 'не указан'}
Бюджетная политика: ${budgetPromptGuidance(assessBudget(request, rates))}
Устойчивые предпочтения: ${preferences}`;
}

function partTimeout(dayCount: number, travelers: number, isCore: boolean) {
  const groupExtra = travelers >= 8 ? 10_000 : travelers >= 4 ? 5_000 : 0;
  return Math.min(90_000, (isCore ? 55_000 : 38_000 + dayCount * 6_000) + groupExtra);
}

export async function generatePlanOverview(request: PlannerRequest, rates: CurrencyRates): Promise<PartResult<TripPlanCore>> {
  const prompt = `${requestContext(request, rates)}
${RECOMMENDATION_SAFETY_GUIDANCE}
Создай только главный обзор поездки: title, destination, rationale, placeIdeas, общий budget, realism и 2–3 варианта transport.
Не создавай расписание по дням, жильё, еду, активности, полезные рекомендации или чек-лист — они будут сгенерированы отдельно при открытии вкладок.
Все суммы относятся ко всей группе. Пиши компактно: каждое описание — одно предложение.`;
  const started = Date.now();
  let lastIssue = '';
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await requestGemini(`${prompt}${lastIssue ? `\nИсправь ошибку структуры: ${lastIssue}` : ''}`,
      partTimeout(0, request.travelers ?? 1, true), { responseSchema: TRIP_PLAN_OVERVIEW_SCHEMA, maxOutputTokens: 4_096 });
    if (!result.ok) return result;
    const parsed = parseTripPlanOverviewText(result.text);
    if ('value' in parsed) return { ok: true, value: parsed.value, elapsedMs: Date.now() - started };
    lastIssue = parsed.error;
  }
  return { ok: false, code: 'INCOMPLETE_AI_PLAN', message: `Не удалось собрать обзор плана: ${lastIssue}`, status: 502 };
}

export async function generatePlanCore(request: PlannerRequest, rates: CurrencyRates): Promise<PartResult<TripPlanCore>> {
  const groupRule = (request.travelers ?? 1) >= 8
    ? 'Это большая группа: давай варианты для группы целиком. Не создавай отдельные рекомендации на каждого человека; жильё описывай как практичную комбинацию номеров или апартаментов, транспорт — с учётом общей вместимости.'
    : '';
  const prompt = `${requestContext(request, rates)}
${RECOMMENDATION_SAFETY_GUIDANCE}
Создай каркас полного плана БЕЗ массива days. Заполни направление, название, rationale, placeIdeas, общий бюджет, realism, ровно 3 варианта транспорта, ровно по 6 вариантов жилья, еды и обзорных активностей (по 2 tier budget, comfortable, luxury), 4 usefulLinks и 5 пунктов checklist. ${groupRule}
Все суммы бюджета относятся ко всей группе; pricePerNight — стоимость подходящего размещения группы за ночь. Пиши компактно, каждое описание — одно предложение.`;
  const started = Date.now();
  let lastIssue = '';
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await requestGemini(`${prompt}${lastIssue ? `\nИсправь ошибку предыдущей структуры: ${lastIssue}` : ''}`, partTimeout(0, request.travelers ?? 1, true), { responseSchema: TRIP_PLAN_CORE_SCHEMA, maxOutputTokens: 8_192 });
    if (!result.ok) return result;
    const parsed = parseTripPlanCoreText(result.text);
    if ('value' in parsed) return { ok: true, value: parsed.value, elapsedMs: Date.now() - started };
    lastIssue = parsed.error;
  }
  return { ok: false, code: 'INCOMPLETE_AI_PLAN', message: `Не удалось собрать каркас большого плана: ${lastIssue}`, status: 502 };
}

export async function generatePlanDays(request: PlannerRequest, rates: CurrencyRates, core: TripPlanCore, startDay: number, endDay: number, previousDay?: TripDay): Promise<PartResult<TripDay[]>> {
  const count = endDay - startDay + 1;
  const restDays = Array.from({ length: count }, (_, index) => startDay + index).filter((day) => day % 7 === 0);
  const destination = destinationOf(core);
  const grounding = await loadPlaceGrounding(destination.city, destination.country, 'activities', (startDay - 1) * 8);
  if (grounding.names.size < 6) return {
    ok: false, code: 'TRAVEL_DATA_UNAVAILABLE', status: 503,
    message: localizedPlannerText(request,
      'Не удалось загрузить реальные места для маршрута. Попробуйте продолжить генерацию немного позже.',
      'Real places could not be loaded for the itinerary. Please continue generation again shortly.',
      'Маршрут үшін нақты орындар жүктелмеді. Генерацияны сәл кейінірек қайталап көріңіз.'),
  };
  const prompt = `${requestContext(request, rates)}
Каркас поездки: ${JSON.stringify({ title: core.title, destination: core.destination, transport: core.transport, rationale: core.rationale, realism: core.realism })}
${grounding.prompt}
${previousDay ? `Предыдущий готовый день: ${JSON.stringify(previousDay)}` : 'Это первый блок маршрута.'}
Сформируй только дни ${startDay}–${endDay} включительно. Номера должны начинаться с ${startDay}. ${request.dates ? 'Даты обязаны точно соответствовать общему периоду.' : 'В date используй «День N».'}
${restDays.length ? `Дни ${restDays.join(', ')} обязательно сделай pace rest и не больше двух лёгких активностей.` : ''}
В обычный день дай 2–4 географически близкие активности, максимум 5. Для большой группы не создавай индивидуальные варианты: estimatedCost указывай для всей группы. Время — HH:MM, durationMinutes 15–720, travelMinutesFromPrevious 0–1440; суммарно не больше 12 часов. Описания короткие.`;
  const started = Date.now();
  let lastIssue = '';
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await requestGemini(`${prompt}${lastIssue ? `\nИсправь ошибку предыдущего блока: ${lastIssue}` : ''}`, partTimeout(count, request.travelers ?? 1, false), { responseSchema: TRIP_DAYS_SCHEMA, maxOutputTokens: 8_192 });
    if (!result.ok) return result;
    const parsed = parseTripDaysText(result.text, core, startDay, endDay);
    if ('value' in parsed) {
      if (!hasGroundedDayPlaces(parsed.value, grounding.names)) {
        lastIssue = 'Каждое activity.place должно точно совпадать с name из списка API; не добавляй выдуманные места.';
        continue;
      }
      return { ok: true, value: parsed.value, elapsedMs: Date.now() - started };
    }
    lastIssue = parsed.error;
  }
  return { ok: false, code: 'INCOMPLETE_AI_PLAN', message: `Не удалось собрать дни ${startDay}–${endDay}: ${lastIssue}`, status: 502 };
}
