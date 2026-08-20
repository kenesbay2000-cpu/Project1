import type { GeneratedTrip, RecommendationTier } from './aiPlannerTypes';
import type { Language, TranslationKey } from '../i18n/translations';
import { languageLocale } from '../i18n/locale';

export type ExportTranslator = (key: TranslationKey, values?: Record<string, string | number>) => string;

export function formatTripDateRange(trip: GeneratedTrip, language: Language, fallback: string) {
  const start = trip.request.dates?.start ?? trip.plan.days[0]?.date;
  const end = trip.request.dates?.end ?? trip.plan.days[trip.plan.days.length - 1]?.date;
  if (!isIsoDate(start) || !isIsoDate(end)) return fallback;
  const formatter = new Intl.DateTimeFormat(languageLocale(language), { day: 'numeric', month: 'short', year: 'numeric' });
  return `${formatter.format(asLocalDate(start))} — ${formatter.format(asLocalDate(end))}`;
}

export function formatTripDayDate(value: string, language: Language) {
  if (!isIsoDate(value)) return value;
  return new Intl.DateTimeFormat(languageLocale(language), {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(asLocalDate(value));
}

export function formatTripMoney(amount: number, currency: string, language: Language) {
  return `${amount.toLocaleString(languageLocale(language))} ${currency}`;
}

export function tierLabel(tier: RecommendationTier | undefined, t: ExportTranslator) {
  return t(`extras.tier.${tier ?? 'comfortable'}`);
}

export function tripPdfFileName(title: string) {
  const safeTitle = title.normalize('NFKC').replace(/[<>:"/\\|?*\u0000-\u001F]/g, ' ').replace(/\s+/g, ' ').trim();
  return `${safeTitle || 'Roamly trip'}.pdf`;
}

function isIsoDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function asLocalDate(value: string) {
  return new Date(`${value}T00:00:00`);
}
