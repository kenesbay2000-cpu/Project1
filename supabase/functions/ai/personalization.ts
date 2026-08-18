import type { PlannerRequest, TripPlan } from './types.ts';

type Pace = 'relaxed' | 'active' | 'balanced';

function detectPace(request: PlannerRequest): Pace {
  const latestEdit = request.routeEdits?.at(-1)?.toLowerCase() ?? '';
  if (/менее насыщ|расслаб|спокойн|медленн|slow|relax|less intense/.test(latestEdit)) return 'relaxed';
  if (/более насыщ|интенсив|активн|быстр|packed|more intense|active pace/.test(latestEdit)) return 'active';
  const confirmedPace = request.confirmedSummary?.pace.toLowerCase() ?? '';
  if (/расслаб|спокойн|медленн|без спеш|slow|relax|leisure/.test(confirmedPace)) return 'relaxed';
  if (/насыщ|интенсив|активн|packed|intense|active/.test(confirmedPace)) return 'active';
  const text = request.prompt.toLowerCase();
  if (/расслаб|спокойн|медленн|без спеш|не спеш|slow|relax|leisure|easy pace/.test(text)) return 'relaxed';
  if (/насыщ|интенсив|активн|успеть максимум|packed|intense|active pace/.test(text)) return 'active';
  return 'balanced';
}

function paceGuidance(pace: Pace) {
  if (pace === 'relaxed') {
    return 'Темп расслабленный: максимум 3 активности, чаще 2; начало не раньше 09:30, между пунктами запас, ежедневно минимум одно большое свободное окно. Используй pace balanced/rest и не ставь active только ради заполнения дня.';
  }
  if (pace === 'active') {
    return 'Темп насыщенный: 4–5 активностей допустимы только при близком расположении; pace active уместен, но лимиты переездов и 12 часов сохраняются.';
  }
  return 'Темп сбалансированный: обычно 3–4 активности, чередуй насыщенные и спокойные части дня и оставляй свободный вечер хотя бы через день.';
}

function ageGuidance(request: PlannerRequest) {
  const ages = request.travelerAges?.length ? request.travelerAges : request.confirmedSummary?.travelers.ages ?? [];
  const company = request.confirmedSummary?.travelers.description ?? '';
  const promptMentionsFamily = /дет|реб[её]нок|семь|family|child|kid/i.test(`${request.prompt} ${company}`);
  const hasYoungChild = ages.some((age) => age < 6);
  const hasChild = ages.some((age) => age < 13) || promptMentionsFamily;
  const hasTeen = ages.some((age) => age >= 13 && age < 18);
  const hasOlderTraveler = ages.some((age) => age >= 65);
  const rules = [];
  if (hasYoungChild) rules.push('Есть ребёнок младше 6 лет: максимум 3 пункта в день, завершай программу до 20:00, добавляй отдых/игру, минимизируй очереди и пересадки.');
  else if (hasChild) rules.push('Есть дети: максимум 3 содержательных пункта в обычный день, добавляй интерактивные семейные места, парки и перерывы; избегай поздних и утомительных программ.');
  if (hasTeen) rules.push('Есть подростки: включай самостоятельные, современные и интерактивные впечатления, а не только взрослые обзорные экскурсии.');
  if (hasOlderTraveler) rules.push('Есть путешественники 65+: снижай объём долгой ходьбы, учитывай доступность и удобные переезды, если пользователь явно не попросил активный формат.');
  if (rules.length === 0) return 'Особых возрастных ограничений из известных данных нет.';
  rules.push('Жильё, рестораны и транспорт также должны подходить самому требовательному возрасту в компании.');
  return rules.join(' ');
}

function confirmedProfileGuidance(request: PlannerRequest) {
  const summary = request.confirmedSummary;
  if (!summary) return ['Подтверждённой структурированной сводки нет: извлеки профиль из запроса и диалога.'];
  const rules = [];
  if (summary.interests.length) {
    rules.push(`Подтверждённые интересы: ${summary.interests.join(', ')}. Они должны определять большинство мест в days, placeIdeas и обзорных activities.`);
  }
  if (summary.lodging) rules.push(`Предпочтения по жилью: ${summary.lodging}. Все варианты accommodations должны им соответствовать, отличаясь районом или ценой, а не типом вопреки запросу.`);
  if (summary.transport) rules.push(`Предпочтения по транспорту: ${summary.transport}. Реальные переезды в days и весь раздел transport должны строиться вокруг этого выбора.`);
  if (summary.constraints.length) rules.push(`Жёсткие ограничения: ${summary.constraints.join('; ')}. Исключи несовместимые варианты полностью.`);
  if (summary.otherDetails.length) rules.push(`Другие важные детали: ${summary.otherDetails.join('; ')}. Отрази их в конкретных решениях подходящих разделов.`);
  return rules.length ? rules : ['В подтверждённой сводке нет дополнительных предпочтений сверх основных параметров.'];
}

function knownAges(request: PlannerRequest) {
  return request.travelerAges?.length ? request.travelerAges : request.confirmedSummary?.travelers.ages ?? [];
}

export function applyPersonalizedPace(plan: TripPlan, request: PlannerRequest): TripPlan {
  const pace = detectPace(request);
  const ages = knownAges(request);
  const company = request.confirmedSummary?.travelers.description ?? request.prompt;
  const hasChild = ages.some((age) => age < 13) || /дет|реб[её]нок|семь|family|child|kid/i.test(company);
  const hasOlderTraveler = ages.some((age) => age >= 65);
  const profileLimit = hasChild || (hasOlderTraveler && pace !== 'active') ? 3 : pace === 'relaxed' ? 3 : pace === 'active' ? 5 : 4;
  const earliestStart = pace === 'relaxed' ? '09:30' : hasChild || hasOlderTraveler ? '09:00' : '';
  return {
    ...plan,
    days: plan.days.map((day) => {
      const limit = day.pace === 'rest' ? Math.min(2, profileLimit) : profileLimit;
      const activities = day.activities.slice(0, limit).map((activity, index) => (
        index === 0 && earliestStart && activity.time < earliestStart ? { ...activity, time: earliestStart } : activity
      ));
      return { ...day, pace: pace === 'relaxed' && day.pace === 'active' ? 'balanced' as const : day.pace, activities };
    }),
  };
}

export function buildPersonalizationGuidance(request: PlannerRequest) {
  const ages = knownAges(request);
  const knownAgeText = ages.join(', ') || 'не указаны полностью';
  const travelers = request.travelers ?? request.confirmedSummary?.travelers.count ?? 'не указано';
  return [
    `Известный состав: ${travelers} человек; возраста: ${knownAgeText}.`,
    ...confirmedProfileGuidance(request),
    paceGuidance(detectPace(request)),
    ageGuidance(request),
    'Каждый явно названный интерес должен менять названия и выбор мест, ресторанов и активностей, а не только rationale. Не заполняй план универсальными достопримечательностями вместо профиля.',
    'Ограничения работают как фильтр: не включай несовместимые места, еду, жильё или транспорт даже с предупреждением.',
    'Все рекомендации food должны соответствовать диете и кулинарным интересам; если ограничений питания нет, не придумывай их.',
    'Перед ответом внутренне проверь каждый день и каждый практический раздел: хотя бы одно конкретное решение должно быть объяснимо профилем пользователя. Этот анализ не выводи.',
    'В rationale только кратко подведи итог: доказательство персонализации должно быть видно раньше — в фактическом количестве пунктов, их названиях и выборе.',
  ].join('\n');
}
