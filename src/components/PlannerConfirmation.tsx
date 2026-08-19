import type { FormEvent } from 'react';
import type { TripSummary } from '../lib/aiPlanner';
import { PlannerGenerationProgress } from './PlannerGenerationProgress';

type Props = {
  summary: TripSummary;
  correction: string;
  isBusy: boolean;
  isGenerating: boolean;
  error: string;
  onCorrectionChange: (value: string) => void;
  onCorrection: (event: FormEvent<HTMLFormElement>) => void;
  onConfirm: () => void;
  onReset: () => void;
};
function show(value: string) { return value || 'Не указано'; }
function list(values: string[]) { return values.length ? values.join(' · ') : 'Не указано'; }

export function PlannerConfirmation(props: Props) {
  const { summary, correction, isBusy, isGenerating, error, onCorrectionChange, onCorrection, onConfirm, onReset } = props;
  const dates = summary.dates.start && summary.dates.end ? `${summary.dates.start} — ${summary.dates.end}` : 'Не указаны';
  const travelers = summary.travelers.count
    ? `${summary.travelers.count}; ${summary.travelers.ages.length ? `возраст: ${summary.travelers.ages.join(', ')}` : show(summary.travelers.description)}`
    : show(summary.travelers.description);
  const budget = summary.budget.max
    ? `${summary.budget.min.toLocaleString('ru-RU')}–${summary.budget.max.toLocaleString('ru-RU')} ${summary.budget.currency}`
    : 'Не указан';
  return (
    <section className="planner-confirmation" aria-labelledby="planner-confirmation-title">
      <span className="planner-confirmation__eyebrow">Проверьте перед генерацией</span>
      <h2 id="planner-confirmation-title">Я правильно понял вашу поездку?</h2>
      <div className="planner-confirmation__grid">
        <dl><dt>Направление</dt><dd>{show(summary.destination)}</dd></dl>
        <dl><dt>Отправление</dt><dd>{show(summary.originCity)}</dd></dl>
        <dl><dt>Даты и длительность</dt><dd>{dates}{summary.durationDays ? ` · ${summary.durationDays} дн.` : ''}</dd></dl>
        <dl><dt>Путешественники</dt><dd>{travelers}</dd></dl>
        <dl><dt>Бюджет</dt><dd>{budget}</dd></dl>
        <dl><dt>Темп</dt><dd>{show(summary.pace)}</dd></dl>
        <dl><dt>Интересы и пожелания</dt><dd>{list(summary.interests)}</dd></dl>
        <dl><dt>Жильё и транспорт</dt><dd>{show(summary.lodging)} · {show(summary.transport)}</dd></dl>
        {(summary.constraints.length > 0 || summary.otherDetails.length > 0) && <dl><dt>Важные детали</dt><dd>{list([...summary.constraints, ...summary.otherDetails])}</dd></dl>}
      </div>
      {isGenerating && <PlannerGenerationProgress />}
      {error && <div className="planner-form__error" role="alert">{error}</div>}
      <div className="planner-confirmation__actions">
        <button className="planner-confirmation__confirm" type="button" disabled={isBusy} onClick={onConfirm}>{isGenerating ? 'Создаём маршрут…' : isBusy ? 'Подождите…' : 'Да, создать полный маршрут'}</button>
        <button className="planner-dialog__reset" type="button" disabled={isBusy} onClick={onReset}>Изменить исходные данные</button>
      </div>
      <form className="planner-confirmation__correction" onSubmit={onCorrection}>
        <label htmlFor="summary-correction">Что нужно поправить?</label>
        <textarea id="summary-correction" required maxLength={4000} rows={3} value={correction} disabled={isBusy} onChange={(event) => onCorrectionChange(event.target.value)} placeholder="Например: бюджет до 2 000 000 KZT, а темп хочу более расслабленный" />
        <button type="submit" disabled={isBusy}>{isBusy ? 'Обновляю сводку…' : 'Обновить сводку'}</button>
      </form>
    </section>
  );
}
