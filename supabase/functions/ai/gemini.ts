import { PLANNER_AI_RESULT_SCHEMA } from './aiResult.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }>;
};

export type GeminiResult =
  | { ok: true; text: string }
  | { ok: false; code: 'AI_NOT_CONFIGURED' | 'AI_UNAVAILABLE' | 'AI_TIMEOUT'; message: string; status: number };

export async function requestGemini(prompt: string): Promise<GeminiResult> {
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not configured');
    return { ok: false, code: 'AI_NOT_CONFIGURED', message: 'Генератор маршрутов пока не настроен.', status: 503 };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: 'Ты опытный планировщик путешествий. Планируй поездки в любые реальные направления мира независимо от каталога сайта. Строго следуй выбранному пользователем направлению, возвращай реалистичный и безопасный маршрут на русском языке. Не выдумывай точные цены или часы работы.' }],
        },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.55,
          maxOutputTokens: 16_384,
          responseMimeType: 'application/json',
          responseJsonSchema: PLANNER_AI_RESULT_SCHEMA,
        },
      }),
    });

    const data = await response.json().catch(() => null) as GeminiResponse | null;
    if (!response.ok) {
      console.error('Gemini request failed with status', response.status);
      return { ok: false, code: 'AI_UNAVAILABLE', message: 'Сервис генерации маршрутов временно недоступен. Попробуйте ещё раз через несколько минут.', status: response.status === 429 ? 503 : 502 };
    }

    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter((part): part is string => typeof part === 'string')
      .join('') ?? '';
    return { ok: true, text };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { ok: false, code: 'AI_TIMEOUT', message: 'ИИ-сервис не успел ответить. Повторите запрос или попробуйте немного позже.', status: 504 };
    }
    console.error('Gemini request failed', error instanceof Error ? error.message : 'Unknown error');
    return { ok: false, code: 'AI_UNAVAILABLE', message: 'Не удалось связаться с ИИ-сервисом. Проверьте подключение и попробуйте позже.', status: 502 };
  } finally {
    clearTimeout(timeout);
  }
}
