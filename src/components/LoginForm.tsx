import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { getLoginError, signInUser } from '../lib/auth';
import { isSupabaseConfigured } from '../lib/supabase';
import { SupabaseSetupMessage } from './SupabaseSetupMessage';
import { GoogleAuthButton } from './GoogleAuthButton';
import { hasPendingTrip } from '../lib/savedPlans';

export function LoginForm() {
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
      setEmailError('Введите корректный email, например name@example.com.');
      return;
    }
    if (!password) { setFormError('Введите пароль.'); return; }
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
      <p className="auth-eyebrow">С возвращением</p>
      <h1>Продолжим путешествие</h1>
      <p className="registration-card__intro">Войдите, чтобы вернуться к своим идеям и планам.</p>
      <form onSubmit={handleSubmit} noValidate>
        <label className={emailError ? 'has-error' : ''}><span>Email</span>
          <input type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setEmailError(''); }} placeholder="name@example.com" aria-invalid={Boolean(emailError)} />
          {emailError && <small>{emailError}</small>}
        </label>
        <div className="auth-password-control">
          <div className="auth-field-heading"><label htmlFor="login-password">Пароль</label><Link href="/forgot-password">Забыли пароль?</Link></div>
          <div className="password-field"><input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => { setPassword(event.target.value); setFormError(''); }} placeholder="Ваш пароль" /><button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Скрыть' : 'Показать'}</button></div>
        </div>
        {formError && <p className="registration-error" role="alert">{formError}</p>}
        <button className="registration-submit" type="submit" disabled={busy}>{busy ? 'Проверяем…' : 'Войти'} <span>→</span></button>
      </form>
      <GoogleAuthButton />
      <p className="auth-switch">Нет аккаунта? <Link href="/signup">Зарегистрироваться</Link></p>
    </section>
  );
}
