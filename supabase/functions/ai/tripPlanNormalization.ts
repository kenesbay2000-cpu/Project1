import type { TripPlan } from './types.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function limitAdjustedActivities(value: unknown) {
  if (!isRecord(value) || !isRecord(value.realism) || value.realism.status !== 'adjusted'
    || !Array.isArray(value.days)) return value;
  let wasTrimmed = false;
  const days = value.days.map((day) => {
    if (!isRecord(day) || !Array.isArray(day.activities)) return day;
    const hasLongTransfer = day.activities.some((activity) => isRecord(activity)
      && typeof activity.travelMinutesFromPrevious === 'number' && activity.travelMinutesFromPrevious > 180);
    const limit = hasLongTransfer ? 3 : 5;
    if (day.activities.length <= limit) return day;
    wasTrimmed = true;
    return { ...day, activities: day.activities.slice(0, limit) };
  });
  if (!wasTrimmed) return value;
  const adjustments = Array.isArray(value.realism.adjustments) ? value.realism.adjustments : [];
  const serverAdjustment = 'Количество активностей в перегруженных днях сокращено до физически выполнимого уровня.';
  return {
    ...value,
    days,
    realism: {
      ...value.realism,
      adjustments: adjustments.includes(serverAdjustment) ? adjustments : [...adjustments, serverAdjustment],
    },
  };
}

function parseMinutes(time: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
}

function formatMinutes(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

export function normalizePlanSchedule(plan: TripPlan) {
  let wasAdjusted = false;
  const days = plan.days.map((day) => {
    const hasLongTransfer = day.activities.some((activity) => activity.travelMinutesFromPrevious > 180);
    const activityLimit = day.pace === 'rest' ? 2 : hasLongTransfer ? 3 : 5;
    let previousEnd = 0;
    let totalMinutes = 0;
    const activities = [] as TripPlan['days'][number]['activities'];
    for (const activity of day.activities.slice(0, activityLimit)) {
      const requestedStart = parseMinutes(activity.time);
      if (requestedStart === null) { activities.push(activity); continue; }
      const earliestStart = activities.length === 0 ? requestedStart : previousEnd + activity.travelMinutesFromPrevious;
      const start = Math.max(requestedStart, earliestStart);
      const nextTotal = totalMinutes + activity.durationMinutes + activity.travelMinutesFromPrevious;
      if (start + activity.durationMinutes > 1_439 || nextTotal > 720) { wasAdjusted = true; break; }
      if (start !== requestedStart) wasAdjusted = true;
      activities.push({ ...activity, time: formatMinutes(start) });
      previousEnd = start + activity.durationMinutes;
      totalMinutes = nextTotal;
    }
    if (activities.length < day.activities.length) wasAdjusted = true;
    return { ...day, activities };
  });
  if (!wasAdjusted) return plan;
  const warning = 'Расписание немного скорректировано, чтобы сохранить реальное время на переезды и не перегружать дни.';
  const adjustment = 'Время начала и количество отдельных активностей согласованы с длительностью переездов.';
  return {
    ...plan,
    days,
    realism: {
      status: 'adjusted' as const,
      warning: plan.realism.warning ? `${plan.realism.warning} ${warning}` : warning,
      adjustments: plan.realism.adjustments.includes(adjustment)
        ? plan.realism.adjustments
        : [...plan.realism.adjustments, adjustment],
    },
  };
}
