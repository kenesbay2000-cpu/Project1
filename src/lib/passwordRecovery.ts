import type { AuthError } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { TranslationKey } from '../i18n/translations';

type Translate = (key: TranslationKey) => string;

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

export function getPasswordResetRequestError(error: unknown, t: Translate) {
  const authError = error as Partial<AuthError>;
  if (authError.code === 'user_not_found') return '';
  if (authError.code === 'email_address_invalid') {
    return t('error.emailInvalid');
  }
  if (authError.code === 'over_email_send_rate_limit' || authError.code === 'over_request_rate_limit') {
    return t('error.tooManyAttempts');
  }
  if (authError.status === 0 || authError.message?.toLowerCase().includes('fetch')) {
    return t('error.network');
  }
  return t('error.sendEmail');
}

export function getPasswordRecoveryError(error: unknown, t: Translate) {
  const authError = error as Partial<AuthError>;
  if (authError.code === 'weak_password') {
    return t('error.recoveryWeak');
  }
  if (authError.code === 'same_password') return t('error.samePassword');
  if (authError.code === 'session_not_found' || authError.code === 'refresh_token_not_found') {
    return t('error.recoveryInvalid');
  }
  if (authError.status === 0 || authError.message?.toLowerCase().includes('fetch')) {
    return t('error.network');
  }
  return t('error.recovery');
}
