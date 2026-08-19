import { parseTripSummary } from './summary.ts';
import type { PlannerRequest } from './types.ts';

type PlannerContext = Pick<PlannerRequest, 'clarifications' | 'summaryCorrections' | 'confirmedSummary' | 'routeEdits' | 'savedPreferences'>;
type ContextResult = { value: PlannerContext } | { error: string };
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parsePlannerContext(value: Record<string, unknown>): ContextResult {
  let clarifications: PlannerRequest['clarifications'];
  if (value.clarifications !== undefined) {
    if (!Array.isArray(value.clarifications) || value.clarifications.length > 3) return { error: 'Диалог уточнений заполнен некорректно.' };
    clarifications = [];
    for (const turn of value.clarifications) {
      if (!isRecord(turn) || !Array.isArray(turn.questions) || turn.questions.length < 1 || turn.questions.length > 3
        || typeof turn.answer !== 'string' || !turn.answer.trim() || turn.answer.trim().length > 4_000) {
        return { error: 'Ответы на уточняющие вопросы заполнены некорректно.' };
      }
      const questions = [];
      for (const question of turn.questions) {
        if (!isRecord(question) || typeof question.id !== 'string' || !/^[a-z0-9_]{2,60}$/.test(question.id)
          || typeof question.text !== 'string' || !question.text.trim() || question.text.trim().length > 500) {
          return { error: 'Уточняющий вопрос заполнен некорректно.' };
        }
        questions.push({ id: question.id, text: question.text.trim() });
      }
      clarifications.push({ questions, answer: turn.answer.trim() });
    }
  }

  let summaryCorrections: string[] | undefined;
  if (value.summaryCorrections !== undefined) {
    if (!Array.isArray(value.summaryCorrections) || value.summaryCorrections.length > 5
      || value.summaryCorrections.some((item) => typeof item !== 'string' || !item.trim() || item.trim().length > 4_000)) {
      return { error: 'Правки сводки заполнены некорректно.' };
    }
    summaryCorrections = value.summaryCorrections.map((item) => String(item).trim());
  }

  const confirmedSummary = value.confirmedSummary === undefined ? undefined : parseTripSummary(value.confirmedSummary);
  if (value.confirmedSummary !== undefined && !confirmedSummary) return { error: 'Подтверждённая сводка заполнена некорректно.' };
  let routeEdits: string[] | undefined;
  if (value.routeEdits !== undefined) {
    if (!Array.isArray(value.routeEdits) || value.routeEdits.length > 10
      || value.routeEdits.some((item) => typeof item !== 'string' || !item.trim() || item.trim().length > 1_000)) {
      return { error: 'История изменений маршрута заполнена некорректно.' };
    }
    routeEdits = value.routeEdits.map((item) => String(item).trim());
  }
  let savedPreferences: string[] | undefined;
  if (value.savedPreferences !== undefined) {
    if (!Array.isArray(value.savedPreferences) || value.savedPreferences.length > 12
      || value.savedPreferences.some((item) => typeof item !== 'string' || !item.trim() || item.trim().length > 180)) {
      return { error: 'Сохранённые предпочтения заполнены некорректно.' };
    }
    savedPreferences = value.savedPreferences.map((item) => String(item).trim());
  }
  return { value: { clarifications, summaryCorrections, confirmedSummary, routeEdits, savedPreferences } };
}
