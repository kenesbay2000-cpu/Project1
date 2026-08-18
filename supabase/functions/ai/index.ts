import { parsePlannerAIResult } from './aiResult.ts';
import { requestGemini } from './gemini.ts';
import { buildPlannerPrompt, parsePlannerRequest } from './plannerRequest.ts';
import { applyBudgetWarning, assessBudget } from './budgetPolicy.ts';
import { analyzeClarifications } from './clarification.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
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

  if (isRecord(requestBody) && requestBody.mode === 'clarify') {
    const clarificationRequest = parsePlannerRequest(requestBody.request);
    if ('error' in clarificationRequest) {
      return failure(clarificationRequest.error.code, clarificationRequest.error.message, 400);
    }
    const clarification = await analyzeClarifications(clarificationRequest.value);
    if (!clarification.ok) return failure(clarification.code, clarification.message, clarification.status);
    return json({ clarification: clarification.clarification });
  }

  const parsedRequest = parsePlannerRequest(requestBody);
  if ('error' in parsedRequest) {
    return failure(parsedRequest.error.code, parsedRequest.error.message, 400);
  }

  const budgetAssessment = assessBudget(parsedRequest.value);
  if (budgetAssessment.level === 'absurdly_low') {
    return failure(
      'BUDGET_TOO_LOW',
      'Даже верхняя граница бюджета выглядит слишком низкой для указанной длительности и числа путешественников. Увеличьте бюджет или сократите поездку.',
      422,
    );
  }

  let lastParseError = '';
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const attemptTimeout = attempt === 0 ? 80_000 : 55_000;
    const gemini = await requestGemini(
      buildPlannerPrompt(parsedRequest.value, attempt > 0, lastParseError),
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
    return json({ plan: applyBudgetWarning(parsedResult.value.plan, budgetAssessment) });
  }

  const realismPrefix = 'Plan realism check failed: ';
  if (lastParseError.startsWith(realismPrefix)) {
    const reason = lastParseError.slice(realismPrefix.length);
    return failure(
      'UNREALISTIC_AI_PLAN',
      `ИИ не смог собрать физически выполнимое расписание даже после повторной проверки. ${reason} Измените сроки или сократите число мест.`,
      502,
    );
  }
  const schemaPrefix = 'Plan schema check failed: ';
  if (lastParseError.startsWith(schemaPrefix)) {
    return failure(
      'INCOMPLETE_AI_PLAN',
      `ИИ дважды вернул неполный план. ${lastParseError.slice(schemaPrefix.length)} Попробуйте ещё раз или немного упростите запрос.`,
      502,
    );
  }

  return failure(
    'INVALID_AI_RESPONSE',
    'Ответ ИИ дважды пришёл неполным или повреждённым. Попробуйте уточнить запрос и запустить генерацию ещё раз.',
    502,
  );
});
