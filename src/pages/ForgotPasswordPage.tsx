import { useState, type FormEvent } from 'react';
import { Link } from 'wouter';
import { RecoveryPageLayout } from '../components/RecoveryPageLayout';
import { SupabaseSetupMessage } from '../components/SupabaseSetupMessage';
import { getPasswordResetRequestError, requestPasswordReset } from '../lib/passwordRecovery';
import { isSupabaseConfigured } from '../lib/supabase';
import { useI18n } from '../i18n/I18nProvider';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [formError, setFormError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    setEmailError(''); setFormError('');
    if (!emailPattern.test(normalizedEmail)) { setEmailError(t('auth.emailInvalid')); return; }
    setBusy(true);
    try {
      await requestPasswordReset(normalizedEmail);
      setSent(true);
    } catch (error) {
      const message = getPasswordResetRequestError(error, t);
      if (!message) setSent(true);
      else setFormError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <RecoveryPageLayout storyTitle={t('recovery.storyForgot')} storyText={t('recovery.storyForgotText')}>
      {!isSupabaseConfigured ? <SupabaseSetupMessage /> : <section className="registration-card recovery-card">
        <p className="auth-eyebrow">{t('recovery.forgotEyebrow')}</p>
        <h1>{t('recovery.forgotTitle')}</h1>
        <p className="registration-card__intro">{t('recovery.forgotIntro')}</p>
        {sent ? <>
          <div className="recovery-confirmation" role="status">
            <strong>{t('recovery.sentTitle')}</strong>{t('recovery.sentText')}
          </div>
          <div className="recovery-actions">
            <Link className="registration-submit" href="/login">{t('recovery.back')} <span>→</span></Link>
            <button className="recovery-card__back" type="button" onClick={() => setSent(false)}>{t('recovery.sendAgain')}</button>
          </div>
        </> : <>
          <form onSubmit={submit} noValidate>
            <label className={emailError ? 'has-error' : ''}>
              <span>Email</span>
              <input type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setEmailError(''); setFormError(''); }} placeholder="name@example.com" aria-invalid={Boolean(emailError)} />
              {emailError && <small>{emailError}</small>}
            </label>
            {formError && <p className="registration-error" role="alert">{formError}</p>}
            <button className="registration-submit" type="submit" disabled={busy}>{busy ? t('recovery.sending') : t('recovery.send')} <span>→</span></button>
          </form>
          <Link className="recovery-card__back" href="/login">← {t('recovery.back')}</Link>
        </>}
      </section>}
    </RecoveryPageLayout>
  );
}
