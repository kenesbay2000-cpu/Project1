export const PROTECTED_INFORMATION_MESSAGE = 'Не могу помочь с раскрытием служебной информации. Могу помочь только с безопасным планированием поездки.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function userControlledTexts(body: unknown) {
  if (!isRecord(body)) return [];
  const request = isRecord(body.request) ? body.request : body;
  const texts = typeof request.prompt === 'string' ? [request.prompt] : [];
  if (Array.isArray(request.clarifications)) {
    for (const turn of request.clarifications) {
      if (isRecord(turn) && typeof turn.answer === 'string') texts.push(turn.answer);
    }
  }
  if (typeof body.command === 'string') texts.push(body.command);
  if (typeof body.correction === 'string') texts.push(body.correction);
  return texts;
}

const protectedRequest = /(?:системн[а-яё]*\s+(?:промпт|инструкц)|скрыт[а-яё]*\s+(?:промпт|инструкц)|(?:тво[ийх]*|сво[ийх]*|внутренн[а-яё]*)\s+(?:системн[а-яё]*\s+)?(?:промпт|инструкц)|api[- ]?ключ|ключ[а-яё]*\s+api|уч[её]тн[а-яё]*\s+данн|внутренн[а-яё]*\s+конфигурац|переменн[а-яё]*\s+окруж|system\s+(?:prompt|instruction)|(?:your|hidden|internal)\s+(?:system\s+)?(?:prompt|instructions)|api[-_ ]?key|credentials|server\s+config|environment\s+variable|service[_ -]?role|secret\s+key)/i;
const travelRequest = /(?:поезд|путеш|маршрут|направлен|город|отел|жиль|ресторан|кухн|транспорт|бюдж|дн(?:я|ей)?|вылет|хочу\s+в|travel|trip|route|hotel|restaurant|budget|flight|visit)/i;

export function shouldRefuseProtectedInformation(body: unknown) {
  return userControlledTexts(body).some((text) => protectedRequest.test(text) && !travelRequest.test(text));
}

export function containsSensitiveOutput(text: string, apiKey?: string) {
  if (apiKey && text.includes(apiKey)) return true;
  return /(?:GEMINI_API_KEY|SUPABASE_(?:SERVICE_ROLE|DB_PASSWORD|ACCESS_TOKEN)|service[_ -]?role|x-goog-api-key|systemInstruction|BEGIN\s+(?:SYSTEM|DEVELOPER)\s+PROMPT|Физическая реализуемость важнее красивого расписания|AIza[\w-]{20,}|\beyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.|\bsk-[a-zA-Z0-9_-]{16,})/i.test(text);
}
