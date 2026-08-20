import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { getRegistrationError, registerUser, type RegistrationResult } from '../lib/auth';
import { isSupabaseConfigured } from '../lib/supabase';
import { SupabaseSetupMessage } from './SupabaseSetupMessage';
import { MAX_USERNAME_LENGTH, MIN_USERNAME_LENGTH, usernameIssueKey, validateUsername } from '../lib/username';
import { GoogleAuthButton } from './GoogleAuthButton';
import { hasPendingTrip } from '../lib/savedPlans';
import { useI18n } from '../i18n/I18nProvider';

type FieldErrors = Partial<Record<'name' | 'email' | 'password', string>>;

function validate(name: string, email: string, password: string, emailError: string, passwordError: string, usernameMessage: (name: string) => string): FieldErrors {
  const errors: FieldErrors = {};
  const usernameError = validateUsername(name);
  if (usernameError) errors.name = usernameMessage(name);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = emailError;
  if (password.length < 8) errors.password = passwordError;
  return errors;
}

export function RegistrationForm() {
  const { t } = useI18n();
  const [, navigate] = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isSupabaseConfigured) return <SupabaseSetupMessage />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fieldErrors = validate(name, email, password, t('auth.emailInvalid'), t('auth.passwordMin'), (value) => {
      const issue = validateUsername(value);
      return issue ? t(usernameIssueKey(issue), { min: MIN_USERNAME_LENGTH, max: MAX_USERNAME_LENGTH }) : '';
    });
    setErrors(fieldErrors);
    setFormError('');
    if (Object.keys(fieldErrors).length > 0) return;

    setBusy(true);
    try {
      const hasPendingPlan = hasPendingTrip();
      const registration = await registerUser(name.trim(), email.trim().toLowerCase(), password, hasPendingPlan ? '/planner' : '/');
      if (registration.status === 'signed-in' && hasPendingPlan) { navigate('/planner'); return; }
      setResult(registration);
    } catch (error) {
      setFormError(getRegistrationError(error, t));
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    const needsConfirmation = result.status === 'confirmation-required';
    return (
      <section className="registration-success" role="status">
        <span className="registration-success__mark">✓</span>
        <p className="auth-eyebrow">{t('signup.created')}</p>
        <h1>{needsConfirmation ? t('signup.oneStep') : t('signup.welcome', { name: name.trim() })}</h1>
        <p>{needsConfirmation ? t('signup.emailSent', { email: result.email }) : t('signup.signedIn')}</p>
        <Link href={needsConfirmation ? '/' : '/planner'}>{needsConfirmation ? t('signup.home') : t('signup.plan')} <span>→</span></Link>
      </section>
    );
  }

  return (
    <section className="registration-card">
      <p className="auth-eyebrow">{t('signup.eyebrow')}</p>
      <h1>{t('signup.title')}</h1>
      <p className="registration-card__intro">{t('signup.intro')}</p>
      <form onSubmit={handleSubmit} noValidate>
        <label className={errors.name ? 'has-error' : ''}><span>{t('signup.name')}</span>
          <input autoComplete="name" maxLength={MAX_USERNAME_LENGTH} value={name} onChange={(event) => { setName(event.target.value); setErrors({ ...errors, name: undefined }); }} placeholder={t('signup.namePlaceholder')} aria-invalid={Boolean(errors.name)} />
          {errors.name && <small>{errors.name}</small>}
        </label>
        <label className={errors.email ? 'has-error' : ''}><span>Email</span>
          <input type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setErrors({ ...errors, email: undefined }); }} placeholder="name@example.com" aria-invalid={Boolean(errors.email)} />
          {errors.email && <small>{errors.email}</small>}
        </label>
        <label className={errors.password ? 'has-error' : ''}><span>{t('auth.password')}</span>
          <div className="password-field"><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(event) => { setPassword(event.target.value); setErrors({ ...errors, password: undefined }); }} placeholder={t('signup.passwordPlaceholder')} aria-invalid={Boolean(errors.password)} /><button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? t('auth.hide') : t('auth.show')}</button></div>
          {errors.password ? <small>{errors.password}</small> : <small className="field-hint">{t('signup.passwordHint')}</small>}
        </label>
        {formError && <p className="registration-error" role="alert">{formError}</p>}
        <button className="registration-submit" type="submit" disabled={busy}>{busy ? t('signup.creating') : t('signup.button')} <span>→</span></button>
      </form>
      <GoogleAuthButton />
      <p className="auth-switch">{t('signup.haveAccount')} <Link href="/login">{t('login.button')}</Link></p>
      <p className="registration-terms">{t('signup.terms')}</p>
    </section>
  );
}
