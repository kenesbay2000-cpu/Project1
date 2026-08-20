import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { GeneratedTrip } from './aiPlannerTypes';
import type { Language } from '../i18n/translations';
import { formatTripDateRange, formatTripMoney, tripPdfFileName, type ExportTranslator } from './tripExportFormatting';
import { itineraryPdfContent, routePointsPdfContent } from './tripPdfItinerary';
import { activitiesPdfContent, checklistPdfContent, foodPdfContent, placesPdfContent, practicalPdfContent, stayPdfContent, transportPdfContent } from './tripPdfCollections';

const section = (title: string, content: Content[], pageBreak = false): Content[] => content.length ? [
  { text: title, style: 'sectionTitle', pageBreak: pageBreak ? 'before' : undefined }, ...content,
] : [];

export function buildTripPdfDefinition(trip: GeneratedTrip, language: Language, t: ExportTranslator): TDocumentDefinitions {
  const { plan, request } = trip;
  const period = formatTripDateRange(trip, language, t('overview.datesFallback'));
  const content: Content[] = [
    { text: 'ROAMLY', style: 'brand' },
    { text: t('export.documentLabel'), style: 'eyebrow', margin: [0, 12, 0, 7] },
    { text: plan.title, style: 'title' },
    { text: `${plan.destination.city}, ${plan.destination.country}`, style: 'destination' },
    {
      table: {
        widths: ['*', '*', '*'],
        body: [[
          metaCell(t('export.period'), period),
          metaCell(t('export.travelers'), String(request.travelers ?? '—')),
          metaCell(t('export.totalBudget'), formatTripMoney(plan.budget.total, plan.budget.currency, language)),
        ]],
      },
      layout: 'noBorders', margin: [0, 24, 0, 24],
    },
    { text: t('export.planningLogic'), style: 'sectionTitle' },
    { text: plan.rationale, margin: [0, 0, 0, 12] },
    { text: t('export.realism'), style: 'subheading' },
    { text: plan.realism.warning, margin: [0, 0, 0, 4] },
    ...plan.realism.adjustments.map((value) => ({ text: `• ${value}`, margin: [8, 0, 0, 3] } as Content)),
    ...section(t('workspace.itinerary'), itineraryPdfContent(trip, language, t), true),
    ...section(t('export.routePoints'), [
      { text: t('export.routePointsNote'), style: 'sectionNote' }, ...routePointsPdfContent(trip, t),
    ], true),
    ...section(t('overview.transport'), transportPdfContent(trip)),
    ...section(t('workspace.budget'), budgetContent(trip, language)),
    ...section(t('workspace.stays'), stayPdfContent(trip, language, t), true),
    ...section(t('workspace.food'), foodPdfContent(trip, t)),
    ...section(t('workspace.activities'), activitiesPdfContent(trip, t)),
    ...section(t('overview.placeIdeas'), placesPdfContent(trip)),
    ...section(t('workspace.useful'), practicalPdfContent(trip), true),
    ...section(t('workspace.checklist'), checklistPdfContent(trip)),
  ];
  return documentDefinition(content, t);
}

export async function downloadTripPdf(trip: GeneratedTrip, language: Language, t: ExportTranslator) {
  const deadline = Date.now() + 25_000;
  const [pdfMake, pdfFonts] = await withPdfTimeout(Promise.all([
    import('pdfmake/build/pdfmake'), import('pdfmake/build/vfs_fonts'),
  ]), 25_000);
  const remaining = Math.max(1, deadline - Date.now());
  const document = pdfMake.createPdf(
    buildTripPdfDefinition(trip, language, t), undefined, undefined,
    pdfFonts.default as unknown as Record<string, string>,
  );
  const blob = await createPdfBlob(document, remaining);
  savePdfBlob(blob, tripPdfFileName(trip.plan.title));
}

export function isTripPdfTimeout(error: unknown) {
  return error instanceof Error && error.message === 'PDF_GENERATION_TIMEOUT';
}

type PdfDocument = { getBlob: (callback: (blob: Blob) => void) => void };

function createPdfBlob(document: PdfDocument, timeoutMs: number) {
  return new Promise<Blob>((resolve, reject) => {
    let settled = false;
    const finish = (action: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      action();
    };
    const timeout = window.setTimeout(() => finish(() => reject(new Error('PDF_GENERATION_TIMEOUT'))), timeoutMs);
    try { document.getBlob((blob) => finish(() => resolve(blob))); }
    catch (error) { finish(() => reject(error)); }
  });
}

function withPdfTimeout<T>(operation: Promise<T>, timeoutMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('PDF_GENERATION_TIMEOUT')), timeoutMs);
    operation.then(
      (value) => { window.clearTimeout(timeout); resolve(value); },
      (error: unknown) => { window.clearTimeout(timeout); reject(error); },
    );
  });
}

function savePdfBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function metaCell(label: string, value: string): Content {
  return { stack: [{ text: label, style: 'eyebrow' }, { text: value, bold: true, margin: [0, 5, 0, 0] }], fillColor: '#f4eee8', margin: [9, 10, 9, 10] };
}

function budgetContent(trip: GeneratedTrip, language: Language): Content[] {
  return trip.plan.budget.categories.map((item): Content => ({
    stack: [
      { columns: [{ text: item.category, bold: true }, { text: formatTripMoney(item.amount, trip.plan.budget.currency, language), alignment: 'right' }] },
      { text: item.note, style: 'detail', margin: [0, 2, 0, 0] },
    ],
    margin: [0, 0, 0, 7],
  }));
}

function documentDefinition(content: Content[], t: ExportTranslator): TDocumentDefinitions {
  return {
    pageSize: 'A4', pageMargins: [42, 52, 42, 48], content,
    defaultStyle: { font: 'Roboto', fontSize: 9.5, lineHeight: 1.35, color: '#405960' },
    styles: {
      brand: { fontSize: 10, bold: true, color: '#b85337', characterSpacing: 2.4 },
      eyebrow: { fontSize: 7.5, bold: true, color: '#9a7465', characterSpacing: 1.1 },
      title: { fontSize: 28, bold: true, color: '#17333e', lineHeight: 1.08 },
      destination: { fontSize: 12, color: '#66777c', margin: [0, 7, 0, 0] },
      sectionTitle: { fontSize: 18, bold: true, color: '#17333e', margin: [0, 18, 0, 10] },
      subheading: { fontSize: 11, bold: true, color: '#17333e', margin: [0, 8, 0, 5] },
      sectionNote: { fontSize: 8.5, italics: true, color: '#718086', margin: [0, 0, 0, 10] },
      dayTitle: { fontSize: 12, bold: true, color: '#17333e' }, dayDate: { fontSize: 8, color: '#718086' },
      itemTitle: { fontSize: 10.5, bold: true, color: '#17333e' }, meta: { fontSize: 8, color: '#9a7465', margin: [0, 2, 0, 0] },
      detail: { fontSize: 8, color: '#718086' }, time: { fontSize: 9, bold: true, color: '#b85337' },
      card: { margin: [10, 10, 10, 10] },
    },
    footer: (current, total) => ({ text: t('export.page', { current, total }), alignment: 'right', margin: [42, 10, 42, 0], fontSize: 7.5, color: '#8a979a' }),
    info: { title: String((content[2] as { text?: unknown }).text ?? 'Roamly'), author: 'Roamly', subject: t('export.documentLabel') },
  };
}
