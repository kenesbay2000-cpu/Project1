import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'wouter';
import { PasswordInput } from '../components/PasswordInput';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter';
import { useI18n } from '../i18n/I18nProvider';
import { RecoveryPageLayout } from '../components/RecoveryPageLayout';
import { evaluatePassword } from '../lib/passwordSecurity';
import { getPasswordRecoveryError, resetPassword } from '../lib/passwordRecovery';
import { supabase } from '../lib/supabase';

type RecoveryStatus = 'checking' | 'ready' | 'invalid' | 'success';

function hasRecoveryData() {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.slice(1));
  return query.has('code') || query.get('type') === 'recovery' || hash.get('type') === 'recovery';
}

export function ResetPasswordPage() {
  const { t } = useI18n();
  const [status, setStatus] = useState<RecoveryStatus>('checking');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const strength = useMemo(() => evaluatePassword(password), [password]);

  useEffect(() => {
    let active = true;
    let recoveryDetected = false;
    const recoveryDataPresent = hasRecoveryData();
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (active && event === 'PASSWORD_RECOVERY') { recoveryDetected = true; setStatus('ready'); window.history.replaceState({}, '', '/reset-password'); }
    });
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active || recoveryDetected) return;
      setStatus(!sessionError && recoveryDataPresent && data.session ? 'ready' : 'invalid');
      if (!sessionError && recoveryDataPresent && data.session) window.history.replaceState({}, '', '/reset-password');
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    if (password.length < 8) { setError(t('auth.passwordMin')); return; }
    if (password !== confirmation) { setError(t('auth.passwordMismatch')); return; }
    setBusy(true);
    try { await resetPassword(password); setStatus('success'); setPassword(''); setConfirmation(''); }
    catch (resetError) { setError(getPasswordRecoveryError(resetError, t)); }
    finally { setBusy(false); }
  }

  return (
    <RecoveryPageLayout storyTitle={t('recovery.storyReset')} storyText={t('recovery.storyResetText')}>
      <section className="registration-card recovery-card">
        {status === 'checking' && <div className="recovery-loading" role="status">{t('recovery.checking')}</div>}
        {status === 'invalid' && <>
          <p className="auth-eyebrow">{t('recovery.invalidEyebrow')}</p>
          <h1>{t('recovery.invalidTitle')}</h1>
          <p className="registration-card__intro">{t('recovery.invalidText')}</p>
          <div className="recovery-actions">
            <Link className="registration-submit" href="/forgot-password">{t('recovery.newLink')} <span>→</span></Link>
            <Link className="recovery-card__back" href="/login">{t('recovery.back')}</Link>
          </div>
        </>}
        {status === 'ready' && <>
          <p className="auth-eyebrow">{t('recovery.protection')}</p>
          <h1>{t('recovery.newTitle')}</h1>
          <p className="registration-card__intro">{t('recovery.newIntro')}</p>
          <form onSubmit={submit} noValidate>
            <PasswordInput id="recovery-password" label={t('password.new')} value={password} autoComplete="new-password" onChange={(value) => { setPassword(value); setError(''); }} />
            <PasswordStrengthMeter strength={strength} hasPassword={Boolean(password)} />
            <PasswordInput id="recovery-confirmation" label={t('password.repeat')} value={confirmation} autoComplete="new-password" error={confirmation && confirmation !== password ? t('auth.passwordMismatch') : undefined} onChange={(value) => { setConfirmation(value); setError(''); }} />
            {error && <p className="registration-error" role="alert">{error}</p>}
            <button className="registration-submit" type="submit" disabled={busy}>{busy ? t('profile.saving') : t('recovery.save')} <span>→</span></button>
          </form>
        </>}
        {status === 'success' && <>
          <p className="auth-eyebrow">{t('recovery.saved')}</p>
          <h1>{t('recovery.restored')}</h1>
          <div className="recovery-confirmation" role="status"><strong>{t('recovery.done')}</strong>{t('recovery.doneText')}</div>
          <div className="recovery-actions">
            <Link className="registration-submit" href="/profile">{t('recovery.profile')} <span>→</span></Link>
            <Link className="recovery-card__back" href="/">{t('recovery.home')}</Link>
          </div>
        </>}
      </section>
    </RecoveryPageLayout>
  );
}
