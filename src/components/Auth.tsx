import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { getRegistrationError, registerUser, type RegistrationResult } from '../lib/auth';
import { isSupabaseConfigured } from '../lib/supabase';
import { SupabaseSetupMessage } from './SupabaseSetupMessage';
import { MAX_USERNAME_LENGTH, validateUsername } from '../lib/username';
import { GoogleAuthButton } from './GoogleAuthButton';
import { hasPendingTrip } from '../lib/savedPlans';

type FieldErrors = Partial<Record<'name' | 'email' | 'password', string>>;

function validate(name: string, email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  const usernameError = validateUsername(name);
  if (usernameError) errors.name = usernameError;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Введите корректный email, например name@example.com.';
  if (password.length < 8) errors.password = 'Пароль должен содержать минимум 8 символов.';
  return errors;
}

export function RegistrationForm() {
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
    const fieldErrors = validate(name, email, password);
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
      setFormError(getRegistrationError(error));
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    const needsConfirmation = result.status === 'confirmation-required';
    return (
      <section className="registration-success" role="status">
        <span className="registration-success__mark">✓</span>
        <p className="auth-eyebrow">Аккаунт создан</p>
        <h1>{needsConfirmation ? 'Остался один шаг' : `Добро пожаловать, ${name.trim()}!`}</h1>
        <p>{needsConfirmation ? `Мы отправили письмо на ${result.email}. Перейдите по ссылке, чтобы подтвердить email и завершить регистрацию.` : 'Вы уже вошли в аккаунт и можете начинать планировать путешествие.'}</p>
        <Link href={needsConfirmation ? '/' : '/planner'}>{needsConfirmation ? 'Вернуться на главную' : 'Перейти к планированию'} <span>→</span></Link>
      </section>
    );
  }

  return (
    <section className="registration-card">
      <p className="auth-eyebrow">Новый аккаунт</p>
      <h1>Путешествия начинаются здесь</h1>
      <p className="registration-card__intro">Сохраняйте идеи и собирайте поездки в одном спокойном пространстве.</p>
      <form onSubmit={handleSubmit} noValidate>
        <label className={errors.name ? 'has-error' : ''}><span>Ваше имя</span>
          <input autoComplete="name" maxLength={MAX_USERNAME_LENGTH} value={name} onChange={(event) => { setName(event.target.value); setErrors({ ...errors, name: undefined }); }} placeholder="Как к вам обращаться?" aria-invalid={Boolean(errors.name)} />
          {errors.name && <small>{errors.name}</small>}
        </label>
        <label className={errors.email ? 'has-error' : ''}><span>Email</span>
          <input type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setErrors({ ...errors, email: undefined }); }} placeholder="name@example.com" aria-invalid={Boolean(errors.email)} />
          {errors.email && <small>{errors.email}</small>}
        </label>
        <label className={errors.password ? 'has-error' : ''}><span>Пароль</span>
          <div className="password-field"><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(event) => { setPassword(event.target.value); setErrors({ ...errors, password: undefined }); }} placeholder="Минимум 8 символов" aria-invalid={Boolean(errors.password)} /><button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Скрыть' : 'Показать'}</button></div>
          {errors.password ? <small>{errors.password}</small> : <small className="field-hint">Используйте 8 или больше символов.</small>}
        </label>
        {formError && <p className="registration-error" role="alert">{formError}</p>}
        <button className="registration-submit" type="submit" disabled={busy}>{busy ? 'Создаём аккаунт…' : 'Создать аккаунт'} <span>→</span></button>
      </form>
      <GoogleAuthButton />
      <p className="auth-switch">Уже есть аккаунт? <Link href="/login">Войти</Link></p>
      <p className="registration-terms">Создавая аккаунт, вы соглашаетесь с правилами сервиса и политикой конфиденциальности.</p>
    </section>
  );
}
