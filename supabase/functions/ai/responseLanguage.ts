import type { PlannerRequest } from './types.ts';

export function responseLanguageInstruction(request: PlannerRequest) {
  const language = request.responseLanguage === 'en' ? 'English' : request.responseLanguage === 'kk' ? 'Kazakh' : 'Russian';
  return `OUTPUT LANGUAGE: ${language}. Write every user-visible string in ${language}, regardless of the language used in the user's prompt, answers, corrections, or edit command. Keep JSON property names, enum values, dates, currencies, proper place names, and required budget-note markers exactly as specified.`;
}

export function localizedPlannerText(request: PlannerRequest, ru: string, en: string, kk = ru) {
  return request.responseLanguage === 'en' ? en : request.responseLanguage === 'kk' ? kk : ru;
}
