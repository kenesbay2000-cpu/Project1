import { useEffect, useState, type FormEvent } from 'react';
import { getProfileError, updateDisplayName } from '../lib/auth';
import { useAuth } from './AuthProvider';
import { MAX_USERNAME_LENGTH, MIN_USERNAME_LENGTH, normalizeUsername, usernameIssueKey, validateUsername } from '../lib/username';
import { useI18n } from '../i18n/I18nProvider';

export function AccountProfileForm() {
  const { t } = useI18n();
  const { user, displayName } = useAuth();
  const [name, setName] = useState(displayName);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => setName(displayName), [displayName]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(''); setSaved(false);
    const normalizedName = normalizeUsername(name);
    const usernameError = validateUsername(normalizedName);
    if (usernameError) { setError(t(usernameIssueKey(usernameError), { min: MIN_USERNAME_LENGTH, max: MAX_USERNAME_LENGTH })); return; }
    setBusy(true);
    try {
      await updateDisplayName(normalizedName);
      setSaved(true);
    } catch (profileError) {
      setError(getProfileError(profileError, t));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="account-profile">
      <div className="account-profile__heading"><div><p>{t('profile.personal')}</p><h2>{t('profile.yourProfile')}</h2></div><span>{displayName.slice(0, 1).toUpperCase()}</span></div>
      <form onSubmit={handleSubmit} noValidate>
        <label><span>{t('profile.displayName')}</span><input value={name} maxLength={MAX_USERNAME_LENGTH} onChange={(event) => { setName(event.target.value); setSaved(false); setError(''); }} autoComplete="name" /></label>
        <label><span>Email</span><input value={user?.email ?? ''} disabled aria-label={t('profile.emailFixed')} /></label>
        {error && <p className="account-message account-message--error" role="alert">{error}</p>}
        {saved && <p className="account-message" role="status">{t('profile.nameSaved')}</p>}
        <button type="submit" disabled={busy || name.trim() === displayName}>{busy ? t('profile.saving') : t('profile.save')} <span>→</span></button>
      </form>
    </section>
  );
}
