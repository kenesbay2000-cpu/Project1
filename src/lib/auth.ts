import type { AuthError, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { getSafeDisplayName, normalizeUsername, validateUsername } from './username';

export type RegistrationResult =
  | { status: 'signed-in'; email: string }
  | { status: 'confirmation-required'; email: string };

export async function registerUser(name: string, email: string, password: string): Promise<RegistrationResult> {
  const usernameError = validateUsername(name);
  if (usernameError) throw new Error(`USERNAME:${usernameError}`);
  const normalizedName = normalizeUsername(name);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: normalizedName, full_name: normalizedName },
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

export async function signInUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function ensureGoogleDisplayName(user: User) {
  const usesGoogle = user.app_metadata.provider === 'google'
    || user.identities?.some((identity) => identity.provider === 'google');
  if (!usesGoogle || user.user_metadata.display_name) return user;

  const googleName = user.user_metadata.full_name ?? user.user_metadata.name;
  const displayName = getSafeDisplayName(googleName, 'Путешественник');
  const { data, error } = await supabase.auth.updateUser({ data: { display_name: displayName } });
  if (error) throw error;
  return data.user;
}

export async function updateDisplayName(name: string) {
  const usernameError = validateUsername(name);
  if (usernameError) throw new Error(`USERNAME:${usernameError}`);
  const normalizedName = normalizeUsername(name);
  const { data, error } = await supabase.auth.updateUser({
    data: { display_name: normalizedName, full_name: normalizedName },
  });
  if (error) throw error;
  return data.user;
}

export function getProfileError(error: unknown) {
  if (error instanceof Error && error.message.startsWith('USERNAME:')) return error.message.slice('USERNAME:'.length);
  const authError = error as Partial<AuthError>;
  if (authError.code === 'session_not_found' || authError.code === 'refresh_token_not_found') {
    return 'Сессия завершилась. Войдите снова, чтобы изменить профиль.';
  }
  if (authError.status === 0 || authError.message?.toLowerCase().includes('fetch')) {
    return 'Не удалось связаться с сервером. Проверьте интернет и попробуйте снова.';
  }
  return 'Не удалось сохранить имя. Попробуйте ещё раз.';
}

export function getLoginError(error: unknown) {
  const authError = error as Partial<AuthError>;
  if (authError.code === 'invalid_credentials') return 'Неверный email или пароль. Проверьте данные и попробуйте снова.';
  if (authError.code === 'user_not_found') return 'Пользователь с таким email не найден. Проверьте адрес или зарегистрируйтесь.';
  if (authError.code === 'email_not_confirmed') return 'Email ещё не подтверждён. Откройте письмо от Supabase и перейдите по ссылке.';
  if (authError.code === 'email_address_invalid') return 'Email выглядит некорректно. Проверьте адрес и попробуйте снова.';
  if (authError.status === 0 || authError.message?.toLowerCase().includes('fetch')) return 'Не удалось связаться с сервером. Проверьте интернет и попробуйте снова.';
  return 'Не удалось войти. Проверьте данные и попробуйте ещё раз.';
}

export function getRegistrationError(error: unknown) {
  if (error instanceof Error && error.message.startsWith('USERNAME:')) return error.message.slice('USERNAME:'.length);
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
