import type { AuthError } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type RegistrationResult =
  | { status: 'signed-in'; email: string }
  | { status: 'confirmation-required'; email: string };

export async function registerUser(name: string, email: string, password: string): Promise<RegistrationResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: name, full_name: name },
      emailRedirectTo: window.location.origin,
    },
  });

  if (error) throw error;
  if (data.user && data.user.identities?.length === 0) {
    throw new Error('EMAIL_ALREADY_REGISTERED');
  }

  return data.session
    ? { status: 'signed-in', email }
    : { status: 'confirmation-required', email };
}

export function getRegistrationError(error: unknown) {
  if (error instanceof Error && error.message === 'EMAIL_ALREADY_REGISTERED') {
    return 'Этот email уже зарегистрирован. Попробуйте войти или используйте другой адрес.';
  }

  const authError = error as Partial<AuthError>;
  if (authError.code === 'email_exists' || authError.code === 'user_already_exists') {
    return 'Этот email уже зарегистрирован. Попробуйте войти или используйте другой адрес.';
  }
  if (authError.code === 'email_address_invalid') {
    return 'Email выглядит некорректно. Проверьте адрес и попробуйте снова.';
  }
  if (authError.code === 'email_provider_disabled') {
    return 'Регистрация по email временно недоступна. Попробуйте позже.';
  }
  if (authError.code === 'weak_password') {
    return 'Пароль слишком простой. Добавьте буквы разного регистра, цифры или символы.';
  }
  if (authError.code === 'over_email_send_rate_limit') {
    return 'Слишком много попыток. Подождите несколько минут и попробуйте снова.';
  }
  if (authError.code === 'signup_disabled') {
    return 'Регистрация временно недоступна. Попробуйте позже.';
  }
  if (authError.status === 0 || authError.message?.toLowerCase().includes('fetch')) {
    return 'Не удалось связаться с сервером. Проверьте интернет и попробуйте снова.';
  }
  return 'Не удалось создать аккаунт. Проверьте данные и попробуйте ещё раз.';
}
