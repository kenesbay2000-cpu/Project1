import type { Content } from 'pdfmake/interfaces';
import type { GeneratedTrip } from './aiPlannerTypes';
import type { Language } from '../i18n/translations';
import { formatTripMoney, tierLabel, type ExportTranslator } from './tripExportFormatting';

const card = (label: string, title: string, text: string): Content => ({
  stack: [{ text: label, style: 'eyebrow' }, { text: title, style: 'itemTitle' }, { text, margin: [0, 4, 0, 0] }],
  style: 'card', margin: [0, 0, 0, 9], unbreakable: true,
});

export function transportPdfContent(trip: GeneratedTrip): Content[] {
  return trip.plan.transport.map((item) => card(item.mode, item.route, item.recommendation));
}

export function stayPdfContent(trip: GeneratedTrip, language: Language, t: ExportTranslator): Content[] {
  return trip.plan.accommodations.map((item) => card(
    `${tierLabel(item.tier, t)} · ${item.type} · ${item.area}`,
    item.name,
    `${item.description} · ${formatTripMoney(item.pricePerNight, trip.plan.budget.currency, language)} ${t('extras.perNight')}`,
  ));
}

export function foodPdfContent(trip: GeneratedTrip, t: ExportTranslator): Content[] {
  return trip.plan.food.map((item) => card(
    `${tierLabel(item.tier, t)} · ${item.cuisine} · ${item.priceLevel}`,
    item.name,
    item.description,
  ));
}

export function activitiesPdfContent(trip: GeneratedTrip, t: ExportTranslator): Content[] {
  return trip.plan.activities.map((item) => card(
    `${tierLabel(item.tier, t)} · ${item.category}`,
    item.name,
    item.summary,
  ));
}

export function practicalPdfContent(trip: GeneratedTrip): Content[] {
  return trip.plan.usefulLinks.map((item) => card(item.title, item.title, item.recommendation));
}

export function checklistPdfContent(trip: GeneratedTrip): Content[] {
  return trip.plan.checklist.map((item) => card(item.timing, item.task, item.details));
}

export function placesPdfContent(trip: GeneratedTrip): Content[] {
  return trip.plan.placeIdeas.map((item) => card(item.type, item.name, item.description));
}
