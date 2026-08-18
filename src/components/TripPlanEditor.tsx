import { type FormEvent, useState } from 'react';
import { editTripPlan, type GeneratedTrip } from '../lib/aiPlanner';
import './TripPlanEditor.css';

type Props = { trip: GeneratedTrip; onUpdated: (trip: GeneratedTrip) => void };
const examples = ['Добавь Венецию', 'Убери музеи', 'Добавь ещё 2 дня', 'Сделай маршрут менее насыщенным'];

export function TripPlanEditor({ trip, onUpdated }: Props) {
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
      const updated = await editTripPlan(trip, value);
      onUpdated(updated);
      setCommand('');
      setSuccess('Маршрут обновлён с учётом вашей команды.');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Не удалось изменить маршрут. Попробуйте ещё раз.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="trip-editor" aria-labelledby="trip-editor-title">
      <div className="trip-editor__intro">
        <span>Настройте готовый план</span>
        <h2 id="trip-editor-title">Измените маршрут короткой командой</h2>
        <p>AI сохранит остальной контекст и пересоберёт только то, чего касается изменение.</p>
      </div>
      <div className="trip-editor__examples" aria-label="Примеры команд">
        {examples.map((example) => <button type="button" key={example} disabled={isLoading} onClick={() => setCommand(example)}>{example}</button>)}
      </div>
      <form onSubmit={submit}>
        <label htmlFor="trip-edit-command">Что изменить?</label>
        <div><input id="trip-edit-command" required maxLength={1000} disabled={isLoading} value={command} onChange={(event) => setCommand(event.target.value)} placeholder="Например: добавь свободный вечер в третий день" /><button type="submit" disabled={isLoading || !command.trim()}>{isLoading ? 'Обновляю план…' : 'Применить изменение →'}</button></div>
      </form>
      {isLoading && <p className="trip-editor__status" role="status">Проверяю логистику, даты и нагрузку обновлённого маршрута…</p>}
      {success && <p className="trip-editor__success" role="status">✓ {success}</p>}
      {error && <p className="trip-editor__error" role="alert">{error}</p>}
    </section>
  );
}
