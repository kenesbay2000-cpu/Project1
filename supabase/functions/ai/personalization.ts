import type { PlannerRequest } from './types.ts';

type Pace = 'relaxed' | 'active' | 'balanced';

function detectPace(prompt: string): Pace {
  const text = prompt.toLowerCase();
  if (/расслаб|спокойн|медленн|без спеш|не спеш|slow|relax|leisure|easy pace/.test(text)) return 'relaxed';
  if (/насыщ|интенсив|активн|успеть максимум|packed|intense|active pace/.test(text)) return 'active';
  return 'balanced';
}

function paceGuidance(pace: Pace) {
  if (pace === 'relaxed') {
    return 'Темп расслабленный: обычно 2–3 активности, начало не раньше 09:30, минимум одно большое свободное окно; используй pace balanced/rest, избегай active без крайней необходимости.';
  }
  if (pace === 'active') {
    return 'Темп насыщенный: 4–5 активностей допустимы только при близком расположении; pace active уместен, но лимиты переездов и 12 часов сохраняются.';
  }
  return 'Темп сбалансированный: обычно 3–4 активности, чередуй насыщенные и спокойные части дня.';
}

function ageGuidance(request: PlannerRequest) {
  const ages = request.travelerAges ?? [];
  const promptMentionsFamily = /дет|реб[её]нок|семь|family|child|kid/i.test(request.prompt);
  const hasYoungChild = ages.some((age) => age < 6);
  const hasChild = ages.some((age) => age < 13) || promptMentionsFamily;
  const hasTeen = ages.some((age) => age >= 13 && age < 18);
  const hasOlderTraveler = ages.some((age) => age >= 65);
  const rules = [];
  if (hasYoungChild) rules.push('Есть ребёнок младше 6 лет: максимум 3 пункта в день, завершай программу до 20:00, добавляй отдых/игру, минимизируй очереди и пересадки.');
  else if (hasChild) rules.push('Есть дети: выбирай интерактивные семейные места и парки, обычно не больше 3–4 пунктов, избегай поздних и утомительных программ.');
  if (hasTeen) rules.push('Есть подростки: включай самостоятельные, современные и интерактивные впечатления, а не только взрослые обзорные экскурсии.');
  if (hasOlderTraveler) rules.push('Есть путешественники 65+: снижай объём долгой ходьбы, учитывай доступность и удобные переезды, если пользователь явно не попросил активный формат.');
  if (rules.length === 0) return 'Особых возрастных ограничений из известных данных нет.';
  rules.push('Жильё, рестораны и транспорт также должны подходить самому требовательному возрасту в компании.');
  return rules.join(' ');
}

export function buildPersonalizationGuidance(request: PlannerRequest) {
  const knownAges = request.travelerAges?.join(', ') || 'не указаны полностью';
  return [
    `Известный состав: ${request.travelers ?? 'не указано'} человек; возраста: ${knownAges}.`,
    paceGuidance(detectPace(request.prompt)),
    ageGuidance(request),
    'Сначала внутренне выдели из запроса интересы, ограничения, питание, желаемое жильё и транспорт. Не выводи этот анализ отдельно.',
    'Каждый явно названный интерес должен менять сами выбранные места: большинство содержательных активностей посвяти указанным интересам, а не универсальному туристическому набору.',
    'Ограничения работают как фильтр: не включай несовместимые места, еду, жильё или транспорт даже с предупреждением.',
    'Все 3 варианта жилья должны соответствовать указанному типу, району и важным удобствам; все 4 рекомендации еды — диете и кулинарным интересам.',
    'Предпочтительный транспорт используй и в transport, и в реальных переездах days; нежелательный не предлагай как основной.',
    'В rationale кратко свяжи решения с профилем, но персонализация должна быть видна уже по названиям, темпу и выбору элементов.',
  ].join('\n');
}
