import { useEffect, useState, type FormEvent } from 'react';
import { getProfileError, updateDisplayName } from '../lib/auth';
import { useAuth } from './AuthProvider';
import { MAX_USERNAME_LENGTH, normalizeUsername, validateUsername } from '../lib/username';

export function AccountProfileForm() {
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
    if (usernameError) { setError(usernameError); return; }
    setBusy(true);
    try {
      await updateDisplayName(normalizedName);
      setSaved(true);
    } catch (profileError) {
      setError(getProfileError(profileError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="account-profile">
      <div className="account-profile__heading"><div><p>Личные данные</p><h2>Ваш профиль</h2></div><span>{displayName.slice(0, 1).toUpperCase()}</span></div>
      <form onSubmit={handleSubmit} noValidate>
        <label><span>Отображаемое имя</span><input value={name} maxLength={MAX_USERNAME_LENGTH} onChange={(event) => { setName(event.target.value); setSaved(false); setError(''); }} autoComplete="name" /></label>
        <label><span>Email</span><input value={user?.email ?? ''} disabled aria-label="Email нельзя изменить здесь" /></label>
        {error && <p className="account-message account-message--error" role="alert">{error}</p>}
        {saved && <p className="account-message" role="status">Имя сохранено в вашем профиле.</p>}
        <button type="submit" disabled={busy || name.trim() === displayName}>{busy ? 'Сохраняем…' : 'Сохранить изменения'} <span>→</span></button>
      </form>
    </section>
  );
}
