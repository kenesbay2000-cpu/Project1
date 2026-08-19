import { useEffect, useState, type FormEvent } from 'react';
import {
  addTravelPreference, clearTravelPreferences, deleteTravelPreference,
  loadPreferenceProfile, updateTravelPreference, type TravelPreference,
} from '../lib/travelPreferences';
import { useAuth } from './AuthProvider';

export function TravelPreferencesSettings() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<TravelPreference[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [newPreference, setNewPreference] = useState('');
  const [hasMemory, setHasMemory] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [message, setMessage] = useState('');

  const reload = async () => {
    if (!user) return;
    const profile = await loadPreferenceProfile(user.id);
    setPreferences(profile.active);
    setHasMemory(profile.signals.length > 0);
    setDrafts(Object.fromEntries(profile.active.map((item) => [item.id, item.label])));
  };

  useEffect(() => { void reload().catch(() => setMessage('Не удалось загрузить предпочтения.')); }, [user]);

  const run = async (action: () => Promise<void>, success: string) => {
    setBusy(true); setMessage('');
    try { await action(); await reload(); setMessage(success); }
    catch { setMessage('Не удалось сохранить изменения. Попробуйте ещё раз.'); }
    finally { setBusy(false); }
  };

  const add = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const label = newPreference.trim();
    if (!user || label.length < 2) return;
    void run(async () => { await addTravelPreference(user.id, label); setNewPreference(''); }, 'Предпочтение добавлено.');
  };

  const clearAll = () => {
    if (!user) return;
    void run(() => clearTravelPreferences(user.id), 'Все предпочтения очищены.').then(() => setConfirmClear(false));
  };

  return (
    <section className="travel-preferences">
      <header><div><p>Память AI Planner</p><h2>Предпочтения в поездках</h2></div><span aria-hidden="true">✦</span></header>
      <p className="travel-preferences__intro">Здесь только подтверждённые или повторяющиеся привычки. AI использует их лишь с вашего разрешения перед каждой новой поездкой.</p>
      {preferences.length > 0 ? (
        <div className="travel-preferences__list">
          {preferences.map((preference) => (
            <div className="travel-preferences__item" key={preference.id}>
              <input aria-label="Текст предпочтения" maxLength={180} value={drafts[preference.id] ?? ''} onChange={(event) => setDrafts((current) => ({ ...current, [preference.id]: event.target.value }))} />
              <button type="button" disabled={busy || (drafts[preference.id] ?? '').trim().length < 2 || drafts[preference.id]?.trim() === preference.label} onClick={() => void run(() => updateTravelPreference(preference.id, (drafts[preference.id] ?? '').trim()), 'Предпочтение обновлено.')}>Сохранить</button>
              <button className="travel-preferences__remove" type="button" disabled={busy} aria-label={`Удалить: ${preference.label}`} onClick={() => void run(() => deleteTravelPreference(preference.id), 'Предпочтение удалено.')}>×</button>
            </div>
          ))}
        </div>
      ) : <div className="travel-preferences__empty">Пока сохранённых предпочтений нет. Они появятся после явных или повторяющихся пожеланий в диалогах с AI.</div>}
      <form className="travel-preferences__add" onSubmit={add}>
        <input maxLength={180} value={newPreference} onChange={(event) => setNewPreference(event.target.value)} placeholder="Например: предпочитаю отели в центре" aria-label="Новое предпочтение" />
        <button type="submit" disabled={busy || newPreference.trim().length < 2}>Добавить</button>
      </form>
      {hasMemory && <div className="travel-preferences__clear">{confirmClear ? <><span>Точно очистить всю память о предпочтениях?</span><button type="button" disabled={busy} onClick={clearAll}>Да, очистить</button><button type="button" onClick={() => setConfirmClear(false)}>Отмена</button></> : <button type="button" onClick={() => setConfirmClear(true)}>Очистить всю память о предпочтениях</button>}</div>}
      {message && <p className="travel-preferences__message" role="status">{message}</p>}
    </section>
  );
}
