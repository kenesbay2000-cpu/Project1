import { parsePlannerAIResult } from './aiResult.ts';
import { requestGemini } from './gemini.ts';
import { buildPlannerPrompt, parsePlannerRequest } from './plannerRequest.ts';

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

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return failure('METHOD_NOT_ALLOWED', 'Используйте POST-запрос.', 405);

  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return failure('INVALID_REQUEST', 'Тело запроса должно быть корректным JSON.', 400);
  }

  const parsedRequest = parsePlannerRequest(requestBody);
  if ('error' in parsedRequest) {
    return failure(parsedRequest.error.code, parsedRequest.error.message, 400);
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const gemini = await requestGemini(buildPlannerPrompt(parsedRequest.value, attempt > 0));
    if (!gemini.ok) return failure(gemini.code, gemini.message, gemini.status);

    const parsedResult = parsePlannerAIResult(gemini.text);
    if ('error' in parsedResult) {
      console.error(`Invalid Gemini planner response on attempt ${attempt + 1}:`, parsedResult.error);
      continue;
    }
    if (parsedResult.value.status === 'budget_too_low') {
      return failure(
        'BUDGET_TOO_LOW',
        'Указанного бюджета недостаточно для реалистичной поездки по выбранному направлению и датам. Увеличьте бюджет, сократите длительность или число путешественников.',
        422,
      );
    }
    return json({ plan: parsedResult.value.plan });
  }

  return failure(
    'INVALID_AI_RESPONSE',
    'Ответ ИИ дважды пришёл неполным или повреждённым. Попробуйте уточнить запрос и запустить генерацию ещё раз.',
    502,
  );
});
