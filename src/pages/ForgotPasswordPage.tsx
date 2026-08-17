import { useState, type FormEvent } from 'react';
import { Link } from 'wouter';
import { RecoveryPageLayout } from '../components/RecoveryPageLayout';
import { SupabaseSetupMessage } from '../components/SupabaseSetupMessage';
import { getPasswordResetRequestError, requestPasswordReset } from '../lib/passwordRecovery';
import { isSupabaseConfigured } from '../lib/supabase';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [formError, setFormError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    setEmailError(''); setFormError('');
    if (!emailPattern.test(normalizedEmail)) { setEmailError('Введите корректный email, например name@example.com.'); return; }
    setBusy(true);
    try {
      await requestPasswordReset(normalizedEmail);
      setSent(true);
    } catch (error) {
      const message = getPasswordResetRequestError(error);
      if (!message) setSent(true);
      else setFormError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <RecoveryPageLayout storyTitle="Вернём доступ спокойно и безопасно." storyText="Иногда достаточно одного письма, чтобы снова продолжить путь.">
      {!isSupabaseConfigured ? <SupabaseSetupMessage /> : <section className="registration-card recovery-card">
        <p className="auth-eyebrow">Восстановление доступа</p>
        <h1>Забыли пароль?</h1>
        <p className="registration-card__intro">Укажите email аккаунта — мы отправим защищённую ссылку для создания нового пароля.</p>
        {sent ? <>
          <div className="recovery-confirmation" role="status">
            <strong>Проверьте почту</strong>
            Если такой email зарегистрирован, мы отправили на него письмо. Ссылка действует ограниченное время.
          </div>
          <div className="recovery-actions">
            <Link className="registration-submit" href="/login">Вернуться ко входу <span>→</span></Link>
            <button className="recovery-card__back" type="button" onClick={() => setSent(false)}>Отправить ещё раз</button>
          </div>
        </> : <>
          <form onSubmit={submit} noValidate>
            <label className={emailError ? 'has-error' : ''}>
              <span>Email</span>
              <input type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setEmailError(''); setFormError(''); }} placeholder="name@example.com" aria-invalid={Boolean(emailError)} />
              {emailError && <small>{emailError}</small>}
            </label>
            {formError && <p className="registration-error" role="alert">{formError}</p>}
            <button className="registration-submit" type="submit" disabled={busy}>{busy ? 'Отправляем…' : 'Получить ссылку'} <span>→</span></button>
          </form>
          <Link className="recovery-card__back" href="/login">← Вернуться ко входу</Link>
        </>}
      </section>}
    </RecoveryPageLayout>
  );
}
