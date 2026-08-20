import { useMemo, useState, type FormEvent } from 'react';
import { addPasswordToAccount, changePassword, getPasswordError } from '../lib/auth';
import { evaluatePassword } from '../lib/passwordSecurity';
import { useAuth } from './AuthProvider';
import { PasswordInput } from './PasswordInput';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import './PasswordSettings.css';
import { useI18n } from '../i18n/I18nProvider';

export function PasswordSettings() {
  const { t } = useI18n();
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
    if (!strength.isAcceptable) { setError(t('password.weak')); return; }
    if (newPassword !== confirmation) { setError(t('auth.passwordMismatch')); return; }
    if (hasPassword && !currentPassword) { setError(t('password.currentRequired')); return; }
    if (hasPassword && currentPassword === newPassword) { setError(t('password.mustDiffer')); return; }

    setBusy(true);
    try {
      if (hasPassword) await changePassword(currentPassword, newPassword);
      else await addPasswordToAccount(newPassword);
      setCurrentPassword(''); setNewPassword(''); setConfirmation('');
      setSuccess(hasPassword ? t('password.success') : t('password.addSuccess'));
    } catch (passwordError) {
      setError(getPasswordError(passwordError, !hasPassword, t));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="password-settings">
      <header><div><p>{t('password.eyebrow')}</p><h2>{hasPassword ? t('password.title') : t('password.addTitle')}</h2></div><span aria-hidden="true">◈</span></header>
      {!hasPassword && <div className="password-settings__oauth"><strong>{t('password.oauthTitle')}</strong><p>{t('password.oauthText')}</p></div>}
      <form onSubmit={submit} noValidate>
        {hasPassword && <PasswordInput id="current-password" label={t('password.current')} value={currentPassword} autoComplete="current-password" onChange={(value) => updateField(setCurrentPassword, value)} />}
        <PasswordInput id="new-password" label={t('password.new')} value={newPassword} autoComplete="new-password" onChange={(value) => updateField(setNewPassword, value)} />
        <PasswordStrengthMeter strength={strength} hasPassword={Boolean(newPassword)} />
        <PasswordInput id="password-confirmation" label={t('password.repeat')} value={confirmation} autoComplete="new-password" error={confirmation && confirmation !== newPassword ? t('auth.passwordMismatch') : undefined} onChange={(value) => updateField(setConfirmation, value)} />
        {error && <p className="password-settings__message password-settings__message--error" role="alert">{error}</p>}
        {success && <p className="password-settings__message" role="status">✓ {success}</p>}
        <button type="submit" disabled={busy}>{busy ? t('password.saving') : hasPassword ? t('password.button') : t('password.setButton')} <span>→</span></button>
      </form>
    </section>
  );
}
