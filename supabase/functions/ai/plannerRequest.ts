import type { PlannerRequest } from './types.ts';
import { assessBudget, budgetPromptGuidance } from './budgetPolicy.ts';
import { buildPersonalizationGuidance } from './personalization.ts';
import { parsePlannerContext } from './plannerContext.ts';

type RequestErrorCode = 'INVALID_REQUEST' | 'INVALID_DATES';
type ParseResult = { value: PlannerRequest } | { error: { code: RequestErrorCode; message: string } };

function invalid(message: string, code: RequestErrorCode = 'INVALID_REQUEST'): ParseResult {
  return { error: { code, message } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parsePlannerRequest(value: unknown): ParseResult {
  if (!isRecord(value)) return invalid('Передайте параметры планирования в формате JSON.');
  const prompt = typeof value.prompt === 'string' ? value.prompt.trim() : '';
  if (!prompt) return invalid('Опишите желаемую поездку.');
  if (prompt.length > 4_000) return invalid('Описание поездки не должно превышать 4000 символов.');

  let originCity: string | undefined;
  if (value.originCity !== undefined) {
    if (typeof value.originCity !== 'string' || !value.originCity.trim() || value.originCity.trim().length > 120) {
      return invalid('Город вылета должен содержать от 1 до 120 символов.');
    }
    originCity = value.originCity.trim();
  }

  let dates: PlannerRequest['dates'];
  if (value.dates !== undefined) {
    if (!isRecord(value.dates) || !isIsoDate(value.dates.start) || !isIsoDate(value.dates.end)) {
      return invalid('Укажите корректные даты начала и окончания поездки.', 'INVALID_DATES');
    }
    if (value.dates.start > value.dates.end) {
      return invalid('Дата окончания раньше даты начала. Исправьте даты и повторите запрос.', 'INVALID_DATES');
    }
    dates = { start: value.dates.start, end: value.dates.end };
  }

  let travelers: number | undefined;
  if (value.travelers !== undefined) {
    if (!Number.isInteger(value.travelers) || Number(value.travelers) < 1 || Number(value.travelers) > 20) {
      return invalid('Количество путешественников должно быть от 1 до 20.');
    }
    travelers = Number(value.travelers);
  }

  let travelerAges: number[] | undefined;
  if (value.travelerAges !== undefined) {
    if (!Array.isArray(value.travelerAges) || value.travelerAges.length > 20
      || value.travelerAges.some((age) => !Number.isInteger(age) || age < 0 || age > 120)) {
      return invalid('Возраст каждого путешественника должен быть целым числом от 0 до 120.');
    }
    if (travelers && value.travelerAges.length > travelers) {
      return invalid('Возрастов не может быть больше, чем путешественников.');
    }
    travelerAges = value.travelerAges;
  }

  let priceRange: PlannerRequest['priceRange'];
  if (value.priceRange !== undefined) {
    if (!isRecord(value.priceRange)) return invalid('Диапазон цен заполнен некорректно.');
    const min = Number(value.priceRange.min);
    const max = Number(value.priceRange.max);
    const currency = typeof value.priceRange.currency === 'string' ? value.priceRange.currency.trim().toUpperCase() : 'KZT';
    if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min || !/^[A-Z]{3}$/.test(currency)) {
      return invalid('Укажите корректный диапазон цен и трёхбуквенный код валюты.');
    }
    priceRange = { min, max, currency };
  }

  const context = parsePlannerContext(value);
  if ('error' in context) return invalid(context.error);
  return { value: { prompt, originCity, dates, travelers, travelerAges, priceRange, ...context.value } };
}

export function buildPlannerPrompt(request: PlannerRequest, isRetry = false, retryReason = '') {
  const clarificationText = request.clarifications?.map((turn) => (
    `${turn.questions.map((question) => question.text).join(' / ')}\nОтвет пользователя: ${turn.answer}`
  )).join('\n') ?? '';
  const correctionText = request.summaryCorrections?.join('\n') ?? '';
  const personalizedRequest = clarificationText || correctionText
    ? { ...request, prompt: `${request.prompt}\n${clarificationText}\n${correctionText}` }
    : request;
  const requestedDays = request.dates
    ? Math.round((Date.parse(`${request.dates.end}T00:00:00Z`) - Date.parse(`${request.dates.start}T00:00:00Z`)) / 86_400_000) + 1
    : null;
  const activityVolume = requestedDays && requestedDays >= 15
    ? '2–3 активности в обычный день'
    : requestedDays && requestedDays >= 8 ? '2–4 активности в обычный день' : '3–5 активностей в обычный день';
  const budgetGuidance = budgetPromptGuidance(assessBudget(personalizedRequest));
  const personalization = buildPersonalizationGuidance(personalizedRequest);
  const details = [
    request.confirmedSummary ? `Подтверждённое понимание поездки (главный источник истины):\n${JSON.stringify(request.confirmedSummary)}` : '',
    correctionText ? `Правки сводки:\n${correctionText}` : '',
    clarificationText ? `Уточнения из диалога:\n${clarificationText}` : 'Уточнения из диалога: нет',
    `Запрос пользователя: ${request.prompt}`,
    `Город вылета: ${request.originCity ?? 'не указан'}`,
    request.dates ? `Даты: ${request.dates.start} — ${request.dates.end}` : 'Даты: не указаны',
    requestedDays ? `Количество дней в массиве days: ровно ${requestedDays}` : 'Количество дней: определи разумно из запроса',
    `Путешественников: ${request.travelers ?? 'не указано'}`,
    `Возраст путешественников: ${request.travelerAges?.join(', ') || 'не указан'}`,
    request.priceRange
      ? `Бюджет: ${request.priceRange.min}–${request.priceRange.max} ${request.priceRange.currency}`
      : 'Бюджет: не указан',
    `Бюджетная политика: ${budgetGuidance}`,
    'Точность бюджета: начинай каждую budget.categories[].note с [ТИПИЧНЫЕ ЦЕНЫ] для расчёта по обычной цене за ночь, проезд или вход либо с [ГРУБАЯ ОЦЕНКА] для сильно переменных расходов без актуального предложения.',
    `Обязательная персонализация:\n${personalization}`,
  ];
  const retry = isRetry
    ? `\nПредыдущий ответ не прошёл проверку: ${retryReason || 'неизвестная ошибка'}. Обязательно исправь именно эту причину, а также перепроверь даты, переезды, нагрузку и отдых.`
    : '';
  return `${details.join('\n')}\n\nСоставь конкретный маршрут именно для указанного пользователем реального направления. Не заменяй его городом из какой-либо подборки или каталога. Каталог сайта никак не ограничивает планирование. Правила персонализации выше имеют приоритет над базовым количеством активностей: если профиль требует меньшей нагрузки, уменьши её фактически.\nРеалистичность обязательна: группируй места одного дня по близким районам; указывай время начала строго HH:MM, непустой район и город в area, длительность durationMinutes от 15 до 720 и честное время travelMinutesFromPrevious от 0 до 1440; оставляй временной запас; базовый объём — ${activityVolume}, максимум пять, а при переезде дольше трёх часов — максимум три. Для поездок от восьми дней добавляй минимум один день отдыха на каждые семь дней. Если желаемые города или активности физически не помещаются в сроки, не перегружай days: верни realism.status adjusted, объясни ограничение в warning, перечисли изменения в adjustments и построй более реалистичную версию в тех же датах. Иначе используй status realistic, пустые warning и adjustments. Даты дней должны точно и последовательно покрывать указанный период; если дат нет, используй «День N».\nСформируй компактные отдельные разделы: ровно 3 варианта транспорта, 3 варианта жилья, 4 рекомендации по еде, 5 обзорных активностей, 4 полезные рекомендации и 5 пунктов checklist. Каждое description, summary, recommendation и details — одно короткое информативное предложение без повторов. Транспорт должен охватывать дорогу до направления и перемещения внутри. Не дублируй в обзоре структуру days, не выдумывай внешние URL. Цены жилья указывай за ночь в валюте общего бюджета.\nПолный отказ budget_too_low допустим только если бюджетная политика выше прямо называет верхнюю границу абсурдно низкой. Нижняя граница диапазона — пожелание, а не лимит. Во всех остальных случаях верни status success и адаптируй план под priceRange.max; для плотного бюджета добавь мягкое предупреждение в realism. Суммы должны быть числами в выбранной валюте.${retry}`;
}
