import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { getLoginError, signInUser } from '../lib/auth';
import { isSupabaseConfigured } from '../lib/supabase';
import { SupabaseSetupMessage } from './SupabaseSetupMessage';
import { GoogleAuthButton } from './GoogleAuthButton';
import { hasPendingTrip } from '../lib/savedPlans';
import { useI18n } from '../i18n/I18nProvider';

export function LoginForm() {
  const { t } = useI18n();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!isSupabaseConfigured) return <SupabaseSetupMessage />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailError(''); setFormError('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailError(t('auth.emailInvalid'));
      return;
    }
    if (!password) { setFormError(t('auth.passwordRequired')); return; }
    setBusy(true);
    try {
      await signInUser(normalizedEmail, password);
      navigate(hasPendingTrip() ? '/planner' : '/');
    } catch (error) {
      setFormError(getLoginError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="registration-card login-card">
      <p className="auth-eyebrow">{t('login.eyebrow')}</p>
      <h1>{t('login.title')}</h1>
      <p className="registration-card__intro">{t('login.intro')}</p>
      <form onSubmit={handleSubmit} noValidate>
        <label className={emailError ? 'has-error' : ''}><span>Email</span>
          <input type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setEmailError(''); }} placeholder="name@example.com" aria-invalid={Boolean(emailError)} />
          {emailError && <small>{emailError}</small>}
        </label>
        <div className="auth-password-control">
          <div className="auth-field-heading"><label htmlFor="login-password">{t('auth.password')}</label><Link href="/forgot-password">{t('login.forgot')}</Link></div>
          <div className="password-field"><input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => { setPassword(event.target.value); setFormError(''); }} placeholder={t('login.placeholder')} /><button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? t('auth.hide') : t('auth.show')}</button></div>
        </div>
        {formError && <p className="registration-error" role="alert">{formError}</p>}
        <button className="registration-submit" type="submit" disabled={busy}>{busy ? t('login.checking') : t('login.button')} <span>→</span></button>
      </form>
      <GoogleAuthButton />
      <p className="auth-switch">{t('login.noAccount')} <Link href="/signup">{t('login.register')}</Link></p>
    </section>
  );
}
