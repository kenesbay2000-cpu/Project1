import type { PlannerRequest } from './types.ts';

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

  return { value: { prompt, originCity, dates, travelers, travelerAges, priceRange } };
}

export function buildPlannerPrompt(request: PlannerRequest, isRetry = false) {
  const details = [
    `Запрос пользователя: ${request.prompt}`,
    `Город вылета: ${request.originCity ?? 'не указан'}`,
    request.dates ? `Даты: ${request.dates.start} — ${request.dates.end}` : 'Даты: не указаны',
    `Путешественников: ${request.travelers ?? 'не указано'}`,
    `Возраст путешественников: ${request.travelerAges?.join(', ') || 'не указан'}`,
    request.priceRange
      ? `Бюджет: ${request.priceRange.min}–${request.priceRange.max} ${request.priceRange.currency}`
      : 'Бюджет: не указан',
  ];
  const retry = isRetry
    ? '\nПредыдущий ответ оказался неполным. На этот раз особенно внимательно заполни каждое обязательное поле схемы.'
    : '';
  return `${details.join('\n')}\n\nСоставь конкретный маршрут именно для указанного пользователем реального направления. Не заменяй его городом из какой-либо подборки или каталога. Каталог сайта никак не ограничивает планирование.\nПомимо маршрута days отдельно сформируй: 2–6 вариантов транспорта, 2–6 вариантов жилья, 2–8 рекомендаций по еде, обзор 3–12 активностей, 3–8 полезных рекомендаций и чек-лист из 3–10 пунктов. Транспорт должен охватывать дорогу из города отправления до направления и перемещения внутри него. Учитывай интересы, стиль и бюджет пользователя. Не превращай обзор активностей в повтор маршрута по дням. В usefulLinks давай рекомендации по документам, страховке, валюте и подготовке, но не выдумывай внешние URL. В checklist включай визы, прививки и ранние бронирования только когда они нужны для конкретной поездки. Цены жилья указывай за одну ночь в валюте общего бюджета.\nЕсли максимального бюджета объективно недостаточно даже для базового реалистичного плана на эти даты и число людей, верни status budget_too_low и plan null. Иначе адаптируй поездку под бюджет и верни status success с полным plan. Суммы должны быть числами в указанной валюте (или KZT, если валюта не задана).${retry}`;
}
