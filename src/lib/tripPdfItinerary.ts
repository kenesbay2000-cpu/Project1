import type { Content } from 'pdfmake/interfaces';
import type { GeneratedTrip } from './aiPlannerTypes';
import type { Language } from '../i18n/translations';
import { formatTripDayDate, formatTripMoney, type ExportTranslator } from './tripExportFormatting';

export function itineraryPdfContent(trip: GeneratedTrip, language: Language, t: ExportTranslator): Content[] {
  return trip.plan.days.map((day): Content => ({
    stack: [
      {
        columns: [
          { text: `${t('trip.day', { day: day.day })} · ${day.title}`, style: 'dayTitle' },
          { text: formatTripDayDate(day.date, language), style: 'dayDate', alignment: 'right' },
        ],
        columnGap: 12,
      },
      ...day.activities.map((activity): Content => ({
        columns: [
          { text: activity.time, style: 'time', width: 46 },
          {
            stack: [
              { text: activity.title, style: 'itemTitle' },
              { text: [activity.place, activity.area].filter(Boolean).join(' · '), style: 'meta' },
              { text: activity.description, margin: [0, 3, 0, 0] },
              {
                text: `${activity.durationMinutes} min · ${formatTripMoney(activity.estimatedCost, trip.plan.budget.currency, language)}`,
                style: 'detail',
                margin: [0, 4, 0, 0],
              },
            ],
            width: '*',
          },
        ],
        columnGap: 8,
        margin: [0, 9, 0, 0],
      })),
    ],
    style: 'card',
    unbreakable: day.activities.length <= 5,
    margin: [0, 0, 0, 12],
  }));
}

export function routePointsPdfContent(trip: GeneratedTrip, t: ExportTranslator): Content[] {
  const seen = new Set<string>();
  const points = trip.plan.days.flatMap((day) => day.activities.flatMap((activity) => {
    const place = activity.place.trim();
    if (!place) return [];
    const key = `${place}|${activity.area}`.toLocaleLowerCase();
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ day: day.day, place, area: activity.area }];
  }));
  if (!points.length) return [{ text: t('export.noRoutePoints'), italics: true, color: '#718086' }];
  return points.map((point) => ({
    text: [{ text: `${t('trip.day', { day: point.day })}: `, bold: true }, `${point.place}${point.area ? ` · ${point.area}` : ''}`],
    margin: [0, 0, 0, 6],
  }));
}
