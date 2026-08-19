import { requestGemini, type GeminiResult } from './gemini.ts';
import type { PlannerRequest } from './types.ts';
import { responseLanguageInstruction } from './responseLanguage.ts';

export type PreferenceCandidate = { key: string; label: string; explicit: boolean };
type KnownPreference = { key: string; label: string };
type GeminiFailure = Extract<GeminiResult, { ok: false }>;

const PREFERENCE_SCHEMA = {
  type: 'object',
  properties: {
    candidates: {
      type: 'array', maxItems: 5, items: {
        type: 'object',
        properties: {
          key: { type: 'string' }, label: { type: 'string' }, explicit: { type: 'boolean' },
        },
        required: ['key', 'label', 'explicit'],
      },
    },
  },
  required: ['candidates'],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseKnownPreferences(value: unknown): KnownPreference[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item) || typeof item.key !== 'string' || typeof item.label !== 'string') return [];
    const key = item.key.trim().slice(0, 80);
    const label = item.label.trim().slice(0, 180);
    return key && label ? [{ key, label }] : [];
  }).slice(0, 20);
}

function buildPrompt(request: PlannerRequest, known: KnownPreference[]) {
  const conversation = {
    prompt: request.prompt,
    clarifications: request.clarifications ?? [],
    corrections: request.summaryCorrections ?? [],
  };
  return `${responseLanguageInstruction(request)}
Найди только возможные УСТОЙЧИВЫЕ предпочтения путешественника в новой беседе.
Новая беседа: ${JSON.stringify(conversation)}
Ранее замеченные сигналы (для смыслового совпадения и повторного использования key): ${JSON.stringify(known)}

Правила:
- Не извлекай направление, даты, бюджет, состав компании и другие детали одной конкретной поездки.
- explicit=true только для явно постоянной привычки: «всегда», «обычно», «не люблю», «предпочитаю», «для меня важно», «запомни». Простое пожелание к этой поездке получает explicit=false.
- Если смысл совпадает с ранее замеченным сигналом, обязательно используй его существующий key.
- Иначе key — короткий стабильный snake_case на английском, label — нейтральная короткая формулировка от первого лица строго на языке OUTPUT LANGUAGE.
- Не делай психологических выводов и не додумывай. При сомнении верни пустой массив.`;
}

function parseCandidates(text: string): PreferenceCandidate[] {
  let value: unknown;
  try { value = JSON.parse(text); } catch { value = null; }
  if (!isRecord(value) || !Array.isArray(value.candidates)) return [];
  const seen = new Set<string>();
  return value.candidates.flatMap((item) => {
    if (!isRecord(item) || typeof item.key !== 'string' || typeof item.label !== 'string' || typeof item.explicit !== 'boolean') return [];
    const key = item.key.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 80);
    const label = item.label.trim().slice(0, 180);
    if (key.length < 2 || label.length < 2 || seen.has(key)) return [];
    seen.add(key);
    return [{ key, label, explicit: item.explicit }];
  }).slice(0, 5);
}

export async function learnTravelPreferences(
  request: PlannerRequest,
  known: KnownPreference[],
): Promise<GeminiFailure | { ok: true; candidates: PreferenceCandidate[] }> {
  const result = await requestGemini(buildPrompt(request, known), 20_000, {
    systemInstruction: `Ты осторожно выделяешь только явно устойчивые travel-предпочтения без домыслов. ${responseLanguageInstruction(request)}`,
    responseSchema: PREFERENCE_SCHEMA,
    temperature: 0.1,
    maxOutputTokens: 700,
  });
  if (!result.ok) return result;
  return { ok: true, candidates: parseCandidates(result.text) };
}
