import { type FormEvent, useState } from 'react';
import { editTripPlan, type GeneratedTrip } from '../lib/aiPlanner';
import './TripPlanEditor.css';
import { useI18n } from '../i18n/I18nProvider';

type Props = { trip: GeneratedTrip; onUpdated: (trip: GeneratedTrip) => void };
export function TripPlanEditor({ trip, onUpdated }: Props) {
  const { t, language } = useI18n();
  const examples = [t('editor.example1'), t('editor.example2'), t('editor.example3'), t('editor.example4')];
  const [command, setCommand] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = command.trim();
    if (!value || isLoading) return;
    setIsLoading(true); setError(''); setSuccess('');
    try {
      const updated = await editTripPlan(trip, value, language);
      onUpdated(updated);
      setCommand('');
      setSuccess(t('editor.success'));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t('editor.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="trip-editor" aria-labelledby="trip-editor-title">
      <div className="trip-editor__intro">
        <span>{t('editor.eyebrow')}</span>
        <h2 id="trip-editor-title">{t('editor.title')}</h2>
        <p>{t('editor.intro')}</p>
      </div>
      <div className="trip-editor__examples" aria-label={t('editor.examples')}>
        {examples.map((example) => <button type="button" key={example} disabled={isLoading} onClick={() => setCommand(example)}>{example}</button>)}
      </div>
      <form onSubmit={submit}>
        <label htmlFor="trip-edit-command">{t('editor.label')}</label>
        <div><input id="trip-edit-command" required maxLength={1000} disabled={isLoading} value={command} onChange={(event) => setCommand(event.target.value)} placeholder={t('editor.placeholder')} /><button type="submit" disabled={isLoading || !command.trim()}>{isLoading ? t('editor.updating') : t('editor.apply')}</button></div>
      </form>
      {isLoading && <p className="trip-editor__status" role="status">{t('editor.status')}</p>}
      {success && <p className="trip-editor__success" role="status">✓ {success}</p>}
      {error && <p className="trip-editor__error" role="alert">{error}</p>}
    </section>
  );
}
