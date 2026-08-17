const text = { type: 'string' };
const money = { type: 'number' };

function list(properties: object, required: string[]) {
  return { type: 'array', items: { type: 'object', properties, required } };
}

export const TRIP_PLAN_EXTRA_PROPERTIES = {
  transport: list(
    { mode: text, route: text, recommendation: text },
    ['mode', 'route', 'recommendation'],
  ),
  accommodations: list(
    { name: text, area: text, type: text, pricePerNight: money, description: text },
    ['name', 'area', 'type', 'pricePerNight', 'description'],
  ),
  food: list(
    { name: text, cuisine: text, priceLevel: text, description: text },
    ['name', 'cuisine', 'priceLevel', 'description'],
  ),
  activities: list(
    { name: text, category: text, summary: text },
    ['name', 'category', 'summary'],
  ),
  usefulLinks: list(
    { title: text, recommendation: text },
    ['title', 'recommendation'],
  ),
  checklist: list(
    { task: text, timing: text, details: text },
    ['task', 'timing', 'details'],
  ),
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isText(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isMoney(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isList(value: unknown, validator: (item: unknown) => boolean, min: number, max: number) {
  return Array.isArray(value) && value.length >= min && value.length <= max && value.every(validator);
}

export function getTripPlanExtrasIssue(value: Record<string, unknown>) {
  if (!isList(value.transport, (item) => isRecord(item) && isText(item.mode)
    && isText(item.route) && isText(item.recommendation), 2, 6)) return 'Некорректно заполнен транспорт.';
  if (!isList(value.accommodations, (item) => isRecord(item) && isText(item.name)
    && isText(item.area) && isText(item.type) && isMoney(item.pricePerNight)
    && isText(item.description), 2, 6)) return 'Некорректно заполнены варианты жилья.';
  if (!isList(value.food, (item) => isRecord(item) && isText(item.name)
    && isText(item.cuisine) && isText(item.priceLevel) && isText(item.description), 2, 8)) return 'Некорректно заполнены рекомендации по еде.';
  if (!isList(value.activities, (item) => isRecord(item) && isText(item.name)
    && isText(item.category) && isText(item.summary), 3, 12)) return 'Некорректно заполнен обзор активностей.';
  if (!isList(value.usefulLinks, (item) => isRecord(item) && isText(item.title)
    && isText(item.recommendation), 3, 8)) return 'Некорректно заполнены полезные рекомендации.';
  if (!isList(value.checklist, (item) => isRecord(item) && isText(item.task)
    && isText(item.timing) && isText(item.details), 3, 10)) return 'Некорректно заполнен чек-лист.';
  return null;
}

export function hasValidTripPlanExtras(value: Record<string, unknown>) {
  return getTripPlanExtrasIssue(value) === null;
}
