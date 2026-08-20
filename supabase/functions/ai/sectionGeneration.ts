import type { CurrencyRates } from './exchangeRates.ts';
import { requestGemini } from './gemini.ts';
import { requestContext, type PartResult } from './chunkedGeneration.ts';
import { RECOMMENDATION_SAFETY_GUIDANCE } from './recommendationSafety.ts';
import { localizedPlannerText } from './responseLanguage.ts';
import { parseTripPlanSectionText, tripPlanSectionSchema, type TripPlanCore } from './tripPlanParts.ts';
import type { TripPlanExtraSection } from './tripPlanExtras.ts';
import {
  attachGroundedPhotos, canonicalizeGroundedSectionNames, destinationOf, loadDestinationGrounding,
} from './travelDataGrounding.ts';
import type { PlannerRequest } from './types.ts';
import { loadMultiCityGrounding } from './multiCityGrounding.ts';
import { routeDestinations } from './routeDestinations.ts';

const instructions: Record<TripPlanExtraSection, string> = {
  accommodations: '',
  food: '',
  activities: '',
  usefulLinks: 'Создай 4 полезные рекомендации перед поездкой. Не выдумывай URL: объясни, что и где проверить.',
  checklist: 'Создай 5 персональных пунктов подготовки к этой поездке.',
};

function placeInstructions(section: 'accommodations' | 'food' | 'activities', count: number) {
  const subject = section === 'accommodations' ? 'вариантов жилья'
    : section === 'food' ? 'вариантов еды' : 'активностей';
  return `Выбери ${count} наиболее полезных и разнообразных ${subject} из списка API. При одинаковой полезности предпочитай кандидата с photoAvailable=true, но не жертвуй точностью и разнообразием только ради фото. Не повторяй места и не дополняй список выдуманными вариантами. У каждого варианта обязательно укажи tier: budget, comfortable или luxury. Определи уровень относительно обычных цен именно в этом направлении: сначала используй priceHint и stars, если они есть; иначе разумно оцени тип, категории и характер места. Не используй одинаковые фиксированные суммы для разных стран. Не выравнивай число вариантов каждого уровня искусственно: если подтверждённых мест какого-то уровня нет, просто не добавляй его.`;
}

export async function generatePlanExtraSection(request: PlannerRequest, rates: CurrencyRates, core: TripPlanCore,
  section: TripPlanExtraSection): Promise<PartResult<TripPlanCore[TripPlanExtraSection]>> {
  const destination = destinationOf(core);
  const placeSection = section === 'accommodations' || section === 'food' || section === 'activities' ? section : null;
  const totalDays = request.confirmedSummary?.durationDays ?? 7;
  const destinations = routeDestinations(request, core, totalDays);
  const grounding = placeSection
    ? await loadMultiCityGrounding(destinations.map(({ city, country }) => ({ city, country })), placeSection, 48)
    : { prompt: await loadDestinationGrounding(destination.city, destination.country), names: new Set<string>(), places: [], missingCities: [], elapsedMs: 0 };
  const warnings = placeSection ? grounding.missingCities.map((city) => ({
    section: placeSection,
    city,
    message: localizedPlannerText(request,
      'Не удалось загрузить реальные места для этой вкладки. Попробуйте ещё раз немного позже.',
      'No real places could be loaded for this section. Please try again shortly.',
      'Бұл бөлім үшін нақты орындар жүктелмеді. Сәл кейінірек қайталап көріңіз.'),
  })) : [];
  if (placeSection && grounding.names.size === 0) return {
    ok: true, value: [] as TripPlanCore[TripPlanExtraSection], elapsedMs: grounding.elapsedMs, warnings,
  };
  const sectionInstruction = placeSection
    ? placeInstructions(placeSection, Math.min(12, grounding.names.size))
    : instructions[section];
  const prompt = `${requestContext(request, rates)}
Главный обзор поездки: ${JSON.stringify({ title: core.title, destination: core.destination, budget: core.budget, rationale: core.rationale })}
${grounding.prompt}
${RECOMMENDATION_SAFETY_GUIDANCE}
${sectionInstruction} Для мультигородного маршрута сохрани разнообразие между доступными городами. Верни только объект с полем ${section}. Описания должны быть короткими, по одному предложению.`;
  const started = Date.now();
  let lastIssue = '';
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await requestGemini(`${prompt}${lastIssue ? `\nИсправь ошибку структуры: ${lastIssue}` : ''}`,
      45_000, { responseSchema: tripPlanSectionSchema(section, grounding.places.map((place) => place.name)), maxOutputTokens: 4_096 });
    if (!result.ok) return result;
    const parsed = parseTripPlanSectionText(result.text, section);
    if ('value' in parsed) {
      const canonicalItems = placeSection
        ? canonicalizeGroundedSectionNames(parsed.value as Array<{ name: string }>, grounding.places)
        : parsed.value;
      if (!canonicalItems) {
        lastIssue = 'Каждое название должно соответствовать одному подтверждённому месту из списка API.';
        continue;
      }
      const value = placeSection ? attachGroundedPhotos(canonicalItems, grounding.places) : canonicalItems;
      return { ok: true, value: value as TripPlanCore[TripPlanExtraSection], elapsedMs: Date.now() - started, warnings };
    }
    lastIssue = parsed.error;
  }
  console.error(`[AI validation] Section ${section} remained invalid after retry:`, lastIssue);
  return { ok: false, code: 'INCOMPLETE_AI_PLAN', message: localizedPlannerText(request,
    'Не удалось подготовить этот раздел. Попробуйте ещё раз.',
    'This section could not be prepared. Please try again.',
    'Бұл бөлімді дайындай алмадық. Қайталап көріңіз.'), status: 502 };
}
