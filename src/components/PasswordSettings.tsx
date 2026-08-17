import { useMemo, useState, type FormEvent } from 'react';
import { addPasswordToAccount, changePassword, getPasswordError } from '../lib/auth';
import { evaluatePassword } from '../lib/passwordSecurity';
import { useAuth } from './AuthProvider';
import { PasswordInput } from './PasswordInput';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import './PasswordSettings.css';

export function PasswordSettings() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const providers = Array.isArray(user?.app_metadata.providers) ? user.app_metadata.providers : [];
  const hasEmailIdentity = user?.identities?.some((identity) => identity.provider === 'email') ?? false;
  const hasPassword = hasEmailIdentity || providers.includes('email') || user?.user_metadata.password_enabled === true;
  const strength = useMemo(() => evaluatePassword(newPassword), [newPassword]);

  function updateField(setter: (value: string) => void, value: string) {
    setter(value); setError(''); setSuccess('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(''); setSuccess('');
    if (!strength.isAcceptable) { setError('Новый пароль слишком слабый. Выполните рекомендации индикатора надёжности.'); return; }
    if (newPassword !== confirmation) { setError('Новый пароль и подтверждение не совпадают.'); return; }
    if (hasPassword && !currentPassword) { setError('Введите текущий пароль для подтверждения личности.'); return; }
    if (hasPassword && currentPassword === newPassword) { setError('Новый пароль должен отличаться от текущего.'); return; }

    setBusy(true);
    try {
      if (hasPassword) await changePassword(currentPassword, newPassword);
      else await addPasswordToAccount(newPassword);
      setCurrentPassword(''); setNewPassword(''); setConfirmation('');
      setSuccess(hasPassword ? 'Пароль успешно изменён.' : 'Пароль установлен. Теперь можно входить через Google или по email и паролю.');
    } catch (passwordError) {
      setError(getPasswordError(passwordError, !hasPassword));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="password-settings">
      <header><div><p>Безопасность</p><h2>{hasPassword ? 'Изменить пароль' : 'Добавить пароль'}</h2></div><span aria-hidden="true">◈</span></header>
      {!hasPassword && <div className="password-settings__oauth"><strong>Вы входите через Google</strong><p>Установите пароль, чтобы получить запасной способ входа по email. Аккаунт Google останется подключён.</p></div>}
      <form onSubmit={submit} noValidate>
        {hasPassword && <PasswordInput id="current-password" label="Текущий пароль" value={currentPassword} autoComplete="current-password" onChange={(value) => updateField(setCurrentPassword, value)} />}
        <PasswordInput id="new-password" label="Новый пароль" value={newPassword} autoComplete="new-password" onChange={(value) => updateField(setNewPassword, value)} />
        <PasswordStrengthMeter strength={strength} hasPassword={Boolean(newPassword)} />
        <PasswordInput id="password-confirmation" label="Подтвердите новый пароль" value={confirmation} autoComplete="new-password" error={confirmation && confirmation !== newPassword ? 'Пароли не совпадают.' : undefined} onChange={(value) => updateField(setConfirmation, value)} />
        {error && <p className="password-settings__message password-settings__message--error" role="alert">{error}</p>}
        {success && <p className="password-settings__message" role="status">✓ {success}</p>}
        <button type="submit" disabled={busy}>{busy ? 'Сохраняем…' : hasPassword ? 'Изменить пароль' : 'Установить пароль'} <span>→</span></button>
      </form>
    </section>
  );
}
