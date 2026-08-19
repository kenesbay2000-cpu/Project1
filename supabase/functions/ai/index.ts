import { parsePlannerAIResult } from './aiResult.ts';
import { requestGemini } from './gemini.ts';
import { buildPlannerPrompt, parsePlannerRequest } from './plannerRequest.ts';
import { applyBudgetWarning, assessBudget } from './budgetPolicy.ts';
import { analyzeClarifications } from './clarification.ts';
import { createTripSummary, parseTripSummary } from './summary.ts';
import { editExistingPlan } from './editPlan.ts';
import { isTripPlan } from './tripPlan.ts';
import { PROTECTED_INFORMATION_MESSAGE, shouldRefuseProtectedInformation } from './security.ts';
import { learnTravelPreferences, parseKnownPreferences } from './preferenceLearning.ts';
import { localizedPlannerText } from './responseLanguage.ts';
import { loadExchangeRates } from './exchangeRates.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function failure(code: string, message: string, status: number) {
  return json({ error: { code, message } }, status);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return failure('METHOD_NOT_ALLOWED', 'Используйте POST-запрос.', 405);

  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return failure('INVALID_REQUEST', 'Тело запроса должно быть корректным JSON.', 400);
  }
  if (shouldRefuseProtectedInformation(requestBody)) {
    return failure('PROTECTED_INFORMATION', PROTECTED_INFORMATION_MESSAGE, 400);
  }

  if (isRecord(requestBody) && requestBody.mode === 'clarify') {
    const clarificationRequest = parsePlannerRequest(requestBody.request);
    if ('error' in clarificationRequest) {
      return failure(clarificationRequest.error.code, clarificationRequest.error.message, 400);
    }
    const clarification = await analyzeClarifications(clarificationRequest.value);
    if (!clarification.ok) return failure(clarification.code, clarification.message, clarification.status);
    return json({ clarification: clarification.clarification });
  }

  if (isRecord(requestBody) && requestBody.mode === 'summarize') {
    const summaryRequest = parsePlannerRequest(requestBody.request);
    if ('error' in summaryRequest) return failure(summaryRequest.error.code, summaryRequest.error.message, 400);
    const currentSummary = requestBody.currentSummary === undefined ? undefined : parseTripSummary(requestBody.currentSummary);
    if (requestBody.currentSummary !== undefined && !currentSummary) {
      return failure('INVALID_REQUEST', 'Текущая сводка заполнена некорректно.', 400);
    }
    const correction = typeof requestBody.correction === 'string' ? requestBody.correction.trim() : undefined;
    if (correction && correction.length > 4_000) return failure('INVALID_REQUEST', 'Правка не должна превышать 4000 символов.', 400);
    const result = await createTripSummary(summaryRequest.value, currentSummary, correction);
    if (!result.ok) return failure(result.code, result.message, result.status);
    return json({ summary: result.summary });
  }

  if (isRecord(requestBody) && requestBody.mode === 'learn_preferences') {
    const preferenceRequest = parsePlannerRequest(requestBody.request);
    if ('error' in preferenceRequest) return failure(preferenceRequest.error.code, preferenceRequest.error.message, 400);
    const result = await learnTravelPreferences(preferenceRequest.value, parseKnownPreferences(requestBody.known));
    if (!result.ok) return failure(result.code, result.message, result.status);
    return json({ candidates: result.candidates });
  }

  if (isRecord(requestBody) && requestBody.mode === 'edit') {
    const editRequest = parsePlannerRequest(requestBody.request);
    if ('error' in editRequest) return failure(editRequest.error.code, editRequest.error.message, 400);
    const command = typeof requestBody.command === 'string' ? requestBody.command.trim() : '';
    if (!command || command.length > 1_000) return failure('INVALID_EDIT', 'Опишите изменение в пределах 1000 символов.', 400);
    if (!isTripPlan(requestBody.plan)) return failure('INVALID_EDIT', 'Текущий маршрут повреждён или заполнен не полностью.', 400);
    const exchangeRates = await loadExchangeRates();
    if (!exchangeRates.ok) return failure('EXCHANGE_RATES_UNAVAILABLE', exchangeRates.message, 503);
    const edited = await editExistingPlan(editRequest.value, requestBody.plan, command, exchangeRates.rates);
    if (!edited.ok) return failure(edited.code, edited.message, edited.status);
    return json({ plan: edited.plan, request: edited.request });
  }

  const parsedRequest = parsePlannerRequest(requestBody);
  if ('error' in parsedRequest) {
    return failure(parsedRequest.error.code, parsedRequest.error.message, 400);
  }

  const exchangeRates = await loadExchangeRates();
  if (!exchangeRates.ok) return failure(
    'EXCHANGE_RATES_UNAVAILABLE',
    localizedPlannerText(parsedRequest.value, 'Не удалось загрузить сохранённые курсы валют. Попробуйте ещё раз немного позже.', 'Saved exchange rates could not be loaded. Please try again shortly.'),
    503,
  );
  const budgetAssessment = assessBudget(parsedRequest.value, exchangeRates.rates);
  if (budgetAssessment.level === 'absurdly_low') {
    return failure(
      'BUDGET_TOO_LOW',
      localizedPlannerText(parsedRequest.value, 'Даже верхняя граница бюджета выглядит слишком низкой для указанной длительности и числа путешественников. Увеличьте бюджет или сократите поездку.', 'Even the upper budget limit appears too low for this duration and number of travellers. Increase the budget or shorten the trip.'),
      422,
    );
  }

  let lastParseError = '';
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const attemptTimeout = attempt === 0 ? 80_000 : 55_000;
    const gemini = await requestGemini(
      buildPlannerPrompt(parsedRequest.value, exchangeRates.rates, attempt > 0, lastParseError),
      attemptTimeout,
    );
    if (!gemini.ok) return failure(gemini.code, gemini.message, gemini.status);

    const parsedResult = parsePlannerAIResult(gemini.text, parsedRequest.value);
    if ('error' in parsedResult) {
      lastParseError = parsedResult.error;
      console.error(`Invalid Gemini planner response on attempt ${attempt + 1}:`, parsedResult.error);
      continue;
    }
    if (parsedResult.value.status === 'budget_too_low') {
      lastParseError = `Модель ошибочно отклонила бюджет до ${budgetAssessment.maximumLabel}. Этот запрос не прошёл порог абсурдно низкого бюджета: верни полный plan со status success.`;
      continue;
    }
    return json({ plan: applyBudgetWarning(parsedResult.value.plan, budgetAssessment, parsedRequest.value.responseLanguage) });
  }

  const realismPrefix = 'Plan realism check failed: ';
  if (lastParseError.startsWith(realismPrefix)) {
    const reason = lastParseError.slice(realismPrefix.length);
    return failure(
      'UNREALISTIC_AI_PLAN',
      `${localizedPlannerText(parsedRequest.value, 'ИИ не смог собрать физически выполнимое расписание даже после повторной проверки.', 'AI could not create a physically achievable schedule after a second check.')} ${reason} ${localizedPlannerText(parsedRequest.value, 'Измените сроки или сократите число мест.', 'Adjust the dates or reduce the number of places.')}`,
      502,
    );
  }
  const schemaPrefix = 'Plan schema check failed: ';
  if (lastParseError.startsWith(schemaPrefix)) {
    return failure(
      'INCOMPLETE_AI_PLAN',
      `${localizedPlannerText(parsedRequest.value, 'ИИ дважды вернул неполный план.', 'AI returned an incomplete itinerary twice.')} ${lastParseError.slice(schemaPrefix.length)} ${localizedPlannerText(parsedRequest.value, 'Попробуйте ещё раз или немного упростите запрос.', 'Try again or simplify the request slightly.')}`,
      502,
    );
  }

  return failure(
    'INVALID_AI_RESPONSE',
    localizedPlannerText(parsedRequest.value, 'Ответ ИИ дважды пришёл неполным или повреждённым. Попробуйте уточнить запрос и запустить генерацию ещё раз.', 'The AI response was incomplete or invalid twice. Refine the request and try generating again.'),
    502,
  );
});
