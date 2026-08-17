import type { AuthError } from '@supabase/supabase-js';
import { supabase } from './supabase';

export async function requestPasswordReset(email: string) {
  const redirectTo = new URL('/reset-password', window.location.origin).toString();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

export async function resetPassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return data.user;
}

export function getPasswordResetRequestError(error: unknown) {
  const authError = error as Partial<AuthError>;
  if (authError.code === 'user_not_found') return '';
  if (authError.code === 'email_address_invalid') {
    return 'Email выглядит некорректно. Проверьте адрес и попробуйте снова.';
  }
  if (authError.code === 'over_email_send_rate_limit' || authError.code === 'over_request_rate_limit') {
    return 'Слишком много запросов. Подождите несколько минут и попробуйте снова.';
  }
  if (authError.status === 0 || authError.message?.toLowerCase().includes('fetch')) {
    return 'Не удалось связаться с сервером. Проверьте интернет и попробуйте снова.';
  }
  return 'Не удалось отправить письмо. Попробуйте ещё раз чуть позже.';
}

export function getPasswordRecoveryError(error: unknown) {
  const authError = error as Partial<AuthError>;
  if (authError.code === 'weak_password') {
    return 'Пароль слишком простой. Используйте минимум 8 символов и добавьте разные типы знаков.';
  }
  if (authError.code === 'same_password') return 'Новый пароль должен отличаться от прежнего.';
  if (authError.code === 'session_not_found' || authError.code === 'refresh_token_not_found') {
    return 'Ссылка для восстановления недействительна или уже истекла. Запросите новое письмо.';
  }
  if (authError.status === 0 || authError.message?.toLowerCase().includes('fetch')) {
    return 'Не удалось связаться с сервером. Проверьте интернет и попробуйте снова.';
  }
  return 'Не удалось изменить пароль. Запросите новую ссылку и попробуйте ещё раз.';
}
