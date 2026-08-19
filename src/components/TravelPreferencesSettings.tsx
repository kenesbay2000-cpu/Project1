import { useEffect, useState, type FormEvent } from 'react';
import {
  addTravelPreference, clearTravelPreferences, deleteTravelPreference,
  loadPreferenceProfile, updateTravelPreference, type TravelPreference,
} from '../lib/travelPreferences';
import { useAuth } from './AuthProvider';
import { useI18n } from '../i18n/I18nProvider';

export function TravelPreferencesSettings() {
  const { t } = useI18n();
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

  useEffect(() => { void reload().catch(() => setMessage(t('preferences.loadError'))); }, [user]);

  const run = async (action: () => Promise<void>, success: string) => {
    setBusy(true); setMessage('');
    try { await action(); await reload(); setMessage(success); }
    catch { setMessage(t('preferences.saveError')); }
    finally { setBusy(false); }
  };

  const add = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const label = newPreference.trim();
    if (!user || label.length < 2) return;
    void run(async () => { await addTravelPreference(user.id, label); setNewPreference(''); }, t('preferences.added'));
  };

  const clearAll = () => {
    if (!user) return;
    void run(() => clearTravelPreferences(user.id), t('preferences.cleared')).then(() => setConfirmClear(false));
  };

  return (
    <section className="travel-preferences">
      <header><div><p>{t('preferences.eyebrow')}</p><h2>{t('preferences.title')}</h2></div><span aria-hidden="true">✦</span></header>
      <p className="travel-preferences__intro">{t('preferences.intro')}</p>
      {preferences.length > 0 ? (
        <div className="travel-preferences__list">
          {preferences.map((preference) => (
            <div className="travel-preferences__item" key={preference.id}>
              <input aria-label={t('preferences.text')} maxLength={180} value={drafts[preference.id] ?? ''} onChange={(event) => setDrafts((current) => ({ ...current, [preference.id]: event.target.value }))} />
              <button type="button" disabled={busy || (drafts[preference.id] ?? '').trim().length < 2 || drafts[preference.id]?.trim() === preference.label} onClick={() => void run(() => updateTravelPreference(preference.id, (drafts[preference.id] ?? '').trim()), t('preferences.updated'))}>{t('preferences.save')}</button>
              <button className="travel-preferences__remove" type="button" disabled={busy} aria-label={t('preferences.remove', { label: preference.label })} onClick={() => void run(() => deleteTravelPreference(preference.id), t('preferences.deleted'))}>×</button>
            </div>
          ))}
        </div>
      ) : <div className="travel-preferences__empty">{t('preferences.empty')}</div>}
      <form className="travel-preferences__add" onSubmit={add}>
        <input maxLength={180} value={newPreference} onChange={(event) => setNewPreference(event.target.value)} placeholder={t('preferences.example')} aria-label={t('preferences.new')} />
        <button type="submit" disabled={busy || newPreference.trim().length < 2}>{t('preferences.add')}</button>
      </form>
      {hasMemory && <div className="travel-preferences__clear">{confirmClear ? <><span>{t('preferences.confirmClear')}</span><button type="button" disabled={busy} onClick={clearAll}>{t('preferences.yesClear')}</button><button type="button" onClick={() => setConfirmClear(false)}>{t('preferences.cancel')}</button></> : <button type="button" onClick={() => setConfirmClear(true)}>{t('preferences.clear')}</button>}</div>}
      {message && <p className="travel-preferences__message" role="status">{message}</p>}
    </section>
  );
}
