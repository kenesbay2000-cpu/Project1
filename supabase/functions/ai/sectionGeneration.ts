import type { CurrencyRates } from './exchangeRates.ts';
import { requestGemini } from './gemini.ts';
import { requestContext, type PartResult } from './chunkedGeneration.ts';
import { RECOMMENDATION_SAFETY_GUIDANCE } from './recommendationSafety.ts';
import { localizedPlannerText } from './responseLanguage.ts';
import { parseTripPlanSectionText, tripPlanSectionSchema, type TripPlanCore } from './tripPlanParts.ts';
import type { TripPlanExtraSection } from './tripPlanExtras.ts';
import {
  destinationOf, hasGroundedSectionNames, loadDestinationGrounding, loadPlaceGrounding,
} from './travelDataGrounding.ts';
import type { PlannerRequest } from './types.ts';

const instructions: Record<TripPlanExtraSection, string> = {
  accommodations: 'Создай ровно 6 вариантов жилья: по 2 уровня budget, comfortable и luxury.',
  food: 'Создай ровно 6 рекомендаций по еде: по 2 уровня budget, comfortable и luxury.',
  activities: 'Создай ровно 6 обзорных активностей: по 2 уровня budget, comfortable и luxury.',
  usefulLinks: 'Создай 4 полезные рекомендации перед поездкой. Не выдумывай URL: объясни, что и где проверить.',
  checklist: 'Создай 5 персональных пунктов подготовки к этой поездке.',
};

export async function generatePlanExtraSection(request: PlannerRequest, rates: CurrencyRates, core: TripPlanCore,
  section: TripPlanExtraSection): Promise<PartResult<TripPlanCore[TripPlanExtraSection]>> {
  const destination = destinationOf(core);
  const placeSection = section === 'accommodations' || section === 'food' || section === 'activities' ? section : null;
  const grounding = placeSection
    ? await loadPlaceGrounding(destination.city, destination.country, placeSection)
    : { prompt: await loadDestinationGrounding(destination.city, destination.country), names: new Set<string>() };
  if (placeSection && grounding.names.size < 6) return {
    ok: false, code: 'TRAVEL_DATA_UNAVAILABLE', status: 503,
    message: localizedPlannerText(request,
      'Не удалось загрузить достаточно реальных мест для этой вкладки. Попробуйте ещё раз немного позже.',
      'Not enough real places could be loaded for this section. Please try again shortly.',
      'Бұл бөлім үшін жеткілікті нақты орын жүктелмеді. Сәл кейінірек қайталап көріңіз.'),
  };
  const prompt = `${requestContext(request, rates)}
Главный обзор поездки: ${JSON.stringify({ title: core.title, destination: core.destination, budget: core.budget, rationale: core.rationale })}
${grounding.prompt}
${RECOMMENDATION_SAFETY_GUIDANCE}
${instructions[section]} Верни только объект с полем ${section}. Описания должны быть короткими.`;
  const started = Date.now();
  let lastIssue = '';
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await requestGemini(`${prompt}${lastIssue ? `\nИсправь ошибку структуры: ${lastIssue}` : ''}`,
      45_000, { responseSchema: tripPlanSectionSchema(section), maxOutputTokens: 4_096 });
    if (!result.ok) return result;
    const parsed = parseTripPlanSectionText(result.text, section);
    if ('value' in parsed) {
      if (placeSection && !hasGroundedSectionNames(parsed.value as unknown[], grounding.names)) {
        lastIssue = 'Названия мест должны точно совпадать с кандидатами API; нельзя добавлять организации из памяти модели.';
        continue;
      }
      return { ok: true, value: parsed.value, elapsedMs: Date.now() - started };
    }
    lastIssue = parsed.error;
  }
  return { ok: false, code: 'INCOMPLETE_AI_PLAN', message: `Не удалось собрать вкладку ${section}: ${lastIssue}`, status: 502 };
}
