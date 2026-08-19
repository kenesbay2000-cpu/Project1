import { requestGemini, type GeminiResult } from './gemini.ts';
import type { ClarificationQuestion, PlannerRequest } from './types.ts';
import { localizedPlannerText, responseLanguageInstruction } from './responseLanguage.ts';

const CLARIFICATION_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['questions', 'ready'] },
    message: { type: 'string' },
    originCity: { type: 'string', description: 'Known departure city, or an empty string.' },
    questions: {
      type: 'array',
      maxItems: 3,
      items: {
        type: 'object',
        properties: { id: { type: 'string' }, text: { type: 'string' } },
        required: ['id', 'text'],
      },
    },
  },
  required: ['status', 'message', 'originCity', 'questions'],
};

export type ClarificationResult = {
  status: 'questions' | 'ready';
  message: string;
  originCity?: string;
  questions: ClarificationQuestion[];
};
type GeminiFailure = Extract<GeminiResult, { ok: false }>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function inferOriginCity(request: PlannerRequest) {
  const originAnswer = request.clarifications?.find((turn) => turn.questions.some((question) => question.id === 'origin_city'))?.answer;
  const directAnswer = originAnswer?.split(/[,.!?;\n]/)[0]?.replace(/^(?:мы\s+)?(?:из|город\s+вылета|отправляемся\s+из)\s+/i, '').trim();
  if (directAnswer && directAnswer.length <= 120) return directAnswer;
  const text = [request.prompt, ...(request.clarifications?.map((turn) => turn.answer) ?? [])].join(' ');
  const russianTail = text.match(/(?:вылетаем|вылетаю|вылетаете|летим|отправляемся|отправляюсь|отправляетесь|стартуем|стартую)\s+из\s+([^,.!?;]{2,80})/i)?.[1];
  const englishTail = text.match(/(?:fly|flying|departing|leaving)\s+from\s+([^,.!?;]{2,80})/i)?.[1];
  const tail = russianTail ?? englishTail;
  return tail?.split(/\s+(?:в|на|до|и|с|to|for|on|with)\s+/i)[0]?.trim();
}

function buildPrompt(request: PlannerRequest) {
  const asked = request.clarifications?.flatMap((turn) => turn.questions.map((question) => question.id)) ?? [];
  return `${responseLanguageInstruction(request)}
Проанализируй данные поездки и реши, нужны ли уточнения перед полным планом.
Данные пользователя: ${JSON.stringify(request)}
Уже заданные категории вопросов: ${asked.join(', ') || 'нет'}.

Правила:
- Не задавай вопрос о факте, который уже есть в описании, структурированных полях или ответах диалога.
- Выбери только сведения, которые заметно изменят маршрут, логистику, бюджет или комфорт. Это не фиксированная анкета.
- За один ответ задай от 1 до 3 коротких вопросов. После шести уже заданных вопросов новых не задавай.
- Город вылета обязателен: извлеки его в originCity из любых данных. Если его нигде нет и origin_city ещё не спрашивали, вопрос origin_city должен быть первым.
- Возможные темы для анализа: сроки, бюджет, компания и возраст, интересы, темп, жильё, транспорт, ограничения. Не спрашивай все темы автоматически.
- Для каждого вопроса дай стабильный id латиницей в snake_case; текст вопроса строго на языке OUTPUT LANGUAGE.
- Если важных пробелов больше нет, верни status ready и пустой questions.
- message — одна спокойная короткая реплика ИИ для интерфейса.`;
}

function parseResult(text: string, request: PlannerRequest): ClarificationResult {
  let value: unknown;
  try { value = JSON.parse(text); } catch { value = null; }
  const record = isRecord(value) ? value : {};
  const modelOrigin = typeof record.originCity === 'string' ? record.originCity.trim() : '';
  const originCity = (request.originCity ?? inferOriginCity(request) ?? modelOrigin).slice(0, 120) || undefined;
  const previousQuestions = request.clarifications?.flatMap((turn) => turn.questions) ?? [];
  const askedIds = new Set(previousQuestions.map((question) => question.id));
  const askedTexts = new Set(previousQuestions.map((question) => question.text.trim().toLowerCase()));
  const questions: ClarificationQuestion[] = [];

  if (Array.isArray(record.questions)) {
    for (const item of record.questions) {
      if (!isRecord(item) || typeof item.id !== 'string' || typeof item.text !== 'string') continue;
      const id = item.id.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 60);
      const questionText = item.text.trim().slice(0, 500);
      if (id.length < 2 || !questionText || askedIds.has(id) || askedTexts.has(questionText.toLowerCase())) continue;
      if (!questions.some((question) => question.id === id)) questions.push({ id, text: questionText });
    }
  }

  const mustAskOrigin = !originCity && !askedIds.has('origin_city');
  if (mustAskOrigin && !questions.some((question) => question.id === 'origin_city')) {
    questions.unshift({ id: 'origin_city', text: localizedPlannerText(request, 'Из какого города вы планируете отправляться?', 'Which city will you be departing from?') });
  }
  const reachedLimit = askedIds.size >= 6 || (request.clarifications?.length ?? 0) >= 3;
  const limitedQuestions = reachedLimit && !mustAskOrigin ? [] : questions.slice(0, 3);
  return {
    status: limitedQuestions.length > 0 ? 'questions' : 'ready',
    message: limitedQuestions.length > 0
      ? (typeof record.message === 'string' && record.message.trim() ? record.message.trim() : localizedPlannerText(request, 'Уточню несколько деталей, которые заметно улучшат план.', 'I’ll clarify a few details that will make your itinerary more precise.'))
      : localizedPlannerText(request, 'Данных достаточно — начинаю собирать маршрут.', 'I have everything I need to begin shaping your itinerary.'),
    originCity,
    questions: limitedQuestions,
  };
}

export async function analyzeClarifications(request: PlannerRequest): Promise<GeminiFailure | { ok: true; clarification: ClarificationResult }> {
  const result = await requestGemini(buildPrompt(request), 30_000, {
    systemInstruction: `Ты внимательный travel-консьерж. Задавай только действительно полезные уточнения и никогда не повторяй уже известные данные. ${responseLanguageInstruction(request)}`,
    responseSchema: CLARIFICATION_SCHEMA,
    temperature: 0.25,
    maxOutputTokens: 1_024,
  });
  if (!result.ok) return result;
  return { ok: true, clarification: parseResult(result.text, request) };
}
