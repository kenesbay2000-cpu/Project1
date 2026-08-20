import type { FormEvent } from 'react';
import type { GenerationProgress, TripSummary } from '../lib/aiPlanner';
import { PlannerGenerationProgress } from './PlannerGenerationProgress';
import { useI18n } from '../i18n/I18nProvider';
import { languageLocale } from '../i18n/locale';

type Props = {
  summary: TripSummary;
  correction: string;
  isBusy: boolean;
  isGenerating: boolean;
  generationProgress: GenerationProgress | null;
  error: string;
  onCorrectionChange: (value: string) => void;
  onCorrection: (event: FormEvent<HTMLFormElement>) => void;
  onConfirm: () => void;
  onReset: () => void;
};
export function PlannerConfirmation(props: Props) {
  const { t, language } = useI18n();
  const show = (value: string) => value || t('confirm.unspecified');
  const list = (values: string[]) => values.length ? values.join(' · ') : t('confirm.unspecified');
  const { summary, correction, generationProgress, isBusy, isGenerating, error, onCorrectionChange, onCorrection, onConfirm, onReset } = props;
  const dates = summary.dates.start && summary.dates.end ? `${summary.dates.start} — ${summary.dates.end}` : t('confirm.datesUnspecified');
  const travelers = summary.travelers.count
    ? `${summary.travelers.count}; ${summary.travelers.ages.length ? `${t('confirm.age')}: ${summary.travelers.ages.join(', ')}` : show(summary.travelers.description)}`
    : show(summary.travelers.description);
  const budget = summary.budget.max
    ? `${summary.budget.min.toLocaleString(languageLocale(language))}–${summary.budget.max.toLocaleString(languageLocale(language))} ${summary.budget.currency}`
    : t('confirm.budgetUnspecified');
  return (
    <section className="planner-confirmation" aria-labelledby="planner-confirmation-title">
      <span className="planner-confirmation__eyebrow">{t('confirm.eyebrow')}</span>
      <h2 id="planner-confirmation-title">{t('confirm.title')}</h2>
      <div className="planner-confirmation__grid">
        <dl><dt>{t('confirm.destination')}</dt><dd>{show(summary.destination)}</dd></dl>
        <dl><dt>{t('confirm.departure')}</dt><dd>{show(summary.originCity)}</dd></dl>
        <dl><dt>{t('confirm.dates')}</dt><dd>{dates}{summary.durationDays ? ` · ${summary.durationDays} ${t('confirm.daysShort')}` : ''}</dd></dl>
        <dl><dt>{t('confirm.travelers')}</dt><dd>{travelers}</dd></dl>
        <dl><dt>{t('confirm.budget')}</dt><dd>{budget}</dd></dl>
        <dl><dt>{t('confirm.pace')}</dt><dd>{show(summary.pace)}</dd></dl>
        <dl><dt>{t('confirm.interests')}</dt><dd>{list(summary.interests)}</dd></dl>
        <dl><dt>{t('confirm.stayTransport')}</dt><dd>{show(summary.lodging)} · {show(summary.transport)}</dd></dl>
        {(summary.constraints.length > 0 || summary.otherDetails.length > 0) && <dl><dt>{t('confirm.details')}</dt><dd>{list([...summary.constraints, ...summary.otherDetails])}</dd></dl>}
      </div>
      {isGenerating && <PlannerGenerationProgress progress={generationProgress} />}
      {error && <div className="planner-form__error" role="alert">{error}</div>}
      <div className="planner-confirmation__actions">
        <button className="planner-confirmation__confirm" type="button" disabled={isBusy} onClick={onConfirm}>{isGenerating ? t('confirm.creating') : isBusy ? t('confirm.wait') : t('confirm.create')}</button>
        <button className="planner-dialog__reset" type="button" disabled={isBusy} onClick={onReset}>{t('dialog.reset')}</button>
      </div>
      <form className="planner-confirmation__correction" onSubmit={onCorrection}>
        <label htmlFor="summary-correction">{t('confirm.correction')}</label>
        <textarea id="summary-correction" required maxLength={4000} rows={3} value={correction} disabled={isBusy} onChange={(event) => onCorrectionChange(event.target.value)} placeholder={t('confirm.correctionPlaceholder')} />
        <button type="submit" disabled={isBusy}>{isBusy ? t('confirm.updating') : t('confirm.update')}</button>
      </form>
    </section>
  );
}
