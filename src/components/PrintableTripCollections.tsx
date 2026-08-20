import type { ReactNode } from 'react';
import type { GeneratedTrip } from '../lib/aiPlanner';
import type { ExportTranslator } from '../lib/tripExportFormatting';
import { formatTripMoney, tierLabel } from '../lib/tripExportFormatting';
import type { Language } from '../i18n/translations';

export function PrintSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="plan-print-section"><h2>{title}</h2>{children}</section>;
}

function PrintCard({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return <article className="plan-print-card"><small>{eyebrow}</small><h3>{title}</h3><div>{children}</div></article>;
}

type Props = { trip: GeneratedTrip; language: Language; t: ExportTranslator };

export function PrintableTripCollections({ trip, language, t }: Props) {
  const { plan } = trip;
  return <>
    <PrintSection title={t('overview.transport')}><div className="plan-print-grid">{plan.transport.map((item, index) =>
      <PrintCard key={`${item.route}-${index}`} eyebrow={item.mode} title={item.route}><p>{item.recommendation}</p></PrintCard>)}</div></PrintSection>
    <PrintSection title={t('workspace.budget')}>
      <div className="plan-print-budget">{plan.budget.categories.map((item, index) => <div key={`${item.category}-${index}`}>
        <span><strong>{item.category}</strong><small>{item.note}</small></span><b>{formatTripMoney(item.amount, plan.budget.currency, language)}</b>
      </div>)}</div>
    </PrintSection>
    <PrintSection title={t('workspace.stays')}><div className="plan-print-grid">{plan.accommodations.map((item, index) =>
      <PrintCard key={`${item.name}-${index}`} eyebrow={`${tierLabel(item.tier, t)} · ${item.type} · ${item.area}`} title={item.name}>
        <p>{item.description}</p><b>{formatTripMoney(item.pricePerNight, plan.budget.currency, language)} {t('extras.perNight')}</b>
      </PrintCard>)}</div></PrintSection>
    <PrintSection title={t('workspace.food')}><div className="plan-print-grid">{plan.food.map((item, index) =>
      <PrintCard key={`${item.name}-${index}`} eyebrow={`${tierLabel(item.tier, t)} · ${item.cuisine} · ${item.priceLevel}`} title={item.name}><p>{item.description}</p></PrintCard>)}</div></PrintSection>
    <PrintSection title={t('workspace.activities')}><div className="plan-print-grid">{plan.activities.map((item, index) =>
      <PrintCard key={`${item.name}-${index}`} eyebrow={`${tierLabel(item.tier, t)} · ${item.category}`} title={item.name}><p>{item.summary}</p></PrintCard>)}</div></PrintSection>
    <PrintSection title={t('overview.placeIdeas')}><div className="plan-print-grid">{plan.placeIdeas.map((item, index) =>
      <PrintCard key={`${item.name}-${index}`} eyebrow={item.type} title={item.name}><p>{item.description}</p></PrintCard>)}</div></PrintSection>
    <PrintSection title={t('workspace.useful')}><div className="plan-print-grid">{plan.usefulLinks.map((item, index) =>
      <PrintCard key={`${item.title}-${index}`} eyebrow={t('workspace.useful')} title={item.title}><p>{item.recommendation}</p></PrintCard>)}</div></PrintSection>
    <PrintSection title={t('workspace.checklist')}><div className="plan-print-checklist">{plan.checklist.map((item, index) =>
      <article key={`${item.task}-${index}`}><span>✓</span><div><small>{item.timing}</small><h3>{item.task}</h3><p>{item.details}</p></div></article>)}</div></PrintSection>
  </>;
}
