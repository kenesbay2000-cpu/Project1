import type { PlannerRequest, RealismAssessment, TripPlan } from './types.ts';

export const REALISM_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['realistic', 'adjusted'] },
    warning: { type: 'string' },
    adjustments: { type: 'array', items: { type: 'string' } },
  },
  required: ['status', 'warning', 'adjustments'],
};

function isText(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isRealismAssessment(value: unknown): value is RealismAssessment {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const assessment = value as Record<string, unknown>;
  const adjustments = assessment.adjustments;
  if (assessment.status !== 'realistic' && assessment.status !== 'adjusted') return false;
  if (typeof assessment.warning !== 'string' || !Array.isArray(adjustments) || !adjustments.every(isText)) return false;
  return assessment.status === 'realistic'
    ? adjustments.length === 0
    : isText(assessment.warning) && adjustments.length > 0;
}

function parseMinutes(time: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
}

function expectedDate(start: string, offset: number) {
  const date = new Date(`${start}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function expectedDayCount(start: string, end: string) {
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000) + 1;
}

function validateDaySchedule(day: TripPlan['days'][number]) {
  if (day.activities.length > 5) return `День ${day.day} содержит больше пяти активностей.`;
  if (day.pace === 'rest' && day.activities.length > 2) return `День отдыха ${day.day} перегружен.`;
  let previousEnd = 0;
  let totalMinutes = 0;
  for (const [index, activity] of day.activities.entries()) {
    const start = parseMinutes(activity.time);
    if (start === null) return `У активности ${index + 1} дня ${day.day} нет времени в формате HH:MM.`;
    if (index > 0 && start < previousEnd + activity.travelMinutesFromPrevious) {
      return `В дне ${day.day} не оставлено достаточно времени на переезд к активности ${index + 1}.`;
    }
    previousEnd = start + activity.durationMinutes;
    totalMinutes += activity.durationMinutes + activity.travelMinutesFromPrevious;
    if (previousEnd > 1_439) return `Расписание дня ${day.day} выходит за пределы суток.`;
  }
  if (totalMinutes > 720) return `День ${day.day} требует больше 12 часов активности и переездов.`;
  if (day.activities.some((item) => item.travelMinutesFromPrevious > 180) && day.activities.length > 3) {
    return `День ${day.day} сочетает долгий переезд со слишком большим числом активностей.`;
  }
  return null;
}

export function getPlanRealismIssue(plan: TripPlan, request: PlannerRequest) {
  if (request.dates) {
    const dayCount = expectedDayCount(request.dates.start, request.dates.end);
    if (plan.days.length !== dayCount) return 'Количество дней маршрута не совпадает с указанными датами.';
  }
  for (const [index, day] of plan.days.entries()) {
    if (day.day !== index + 1) return 'Дни маршрута должны идти последовательно без пропусков.';
    if (request.dates && day.date !== expectedDate(request.dates.start, index)) {
      return `Дата дня ${day.day} не совпадает с периодом поездки.`;
    }
    const scheduleIssue = validateDaySchedule(day);
    if (scheduleIssue) return scheduleIssue;
  }
  if (plan.days.length >= 8) {
    const requiredRestDays = Math.floor(plan.days.length / 7);
    if (plan.days.filter((day) => day.pace === 'rest').length < requiredRestDays) {
      return 'В длительной поездке не предусмотрено достаточно дней отдыха.';
    }
  }
  return null;
}
