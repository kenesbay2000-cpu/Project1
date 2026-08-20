import type { AuthError, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { getSafeDisplayName, normalizeUsername, usernameIssueKey, validateUsername, type UsernameIssue } from './username';
import type { TranslationKey } from '../i18n/translations';

type Translate = (key: TranslationKey, values?: Record<string, string | number>) => string;

export type RegistrationResult =
  | { status: 'signed-in'; email: string }
  | { status: 'confirmation-required'; email: string };

export async function registerUser(name: string, email: string, password: string, redirectPath = '/'): Promise<RegistrationResult> {
  const usernameError = validateUsername(name);
  if (usernameError) throw new Error(`USERNAME:${usernameError}`);
  const normalizedName = normalizeUsername(name);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: normalizedName, full_name: normalizedName },
      emailRedirectTo: new URL(redirectPath, window.location.origin).toString(),
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

export async function signInWithGoogle(redirectPath = '/') {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: new URL(redirectPath, window.location.origin).toString() },
  });
  if (error) throw error;
}

export async function ensureGoogleDisplayName(user: User, fallbackName: string) {
  const usesGoogle = user.app_metadata.provider === 'google'
    || user.identities?.some((identity) => identity.provider === 'google');
  if (!usesGoogle || user.user_metadata.display_name) return user;

  const googleName = user.user_metadata.full_name ?? user.user_metadata.name;
  const displayName = getSafeDisplayName(googleName, fallbackName);
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

export async function changePassword(currentPassword: string, newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
    current_password: currentPassword,
  });
  if (error) throw error;
  return data.user;
}

export async function addPasswordToAccount(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
    data: { password_enabled: true },
  });
  if (error) throw error;
  return data.user;
}

export function getPasswordError(error: unknown, isSettingPassword: boolean, t: Translate) {
  const authError = error as Partial<AuthError>;
  const message = authError.message?.toLowerCase() ?? '';
  if (authError.code === 'invalid_credentials' || message.includes('current password') || message.includes('invalid login')) {
    return t('error.currentPassword');
  }
  if (authError.code === 'weak_password' || message.includes('weak password')) {
    return t('error.weakPassword');
  }
  if (authError.code === 'same_password' || message.includes('same password')) return t('error.samePassword');
  if (authError.code === 'reauthentication_needed') {
    return isSettingPassword
      ? t('error.reauthGoogle')
      : t('error.reauthPassword');
  }
  if (authError.code === 'over_request_rate_limit') return t('error.tooManyAttempts');
  if (authError.code === 'session_not_found' || authError.code === 'refresh_token_not_found') return t('error.sessionExpired');
  if (authError.status === 0 || message.includes('fetch')) return t('error.network');
  return t(isSettingPassword ? 'error.setPassword' : 'error.changePassword');
}

export function getProfileError(error: unknown, t: Translate) {
  if (error instanceof Error && error.message.startsWith('USERNAME:')) return t(usernameIssueKey(error.message.slice('USERNAME:'.length) as UsernameIssue), { min: 2, max: 18 });
  const authError = error as Partial<AuthError>;
  if (authError.code === 'session_not_found' || authError.code === 'refresh_token_not_found') {
    return t('error.profileSession');
  }
  if (authError.status === 0 || authError.message?.toLowerCase().includes('fetch')) {
    return t('error.network');
  }
  return t('error.profileSave');
}

export function getLoginError(error: unknown, t: Translate) {
  const authError = error as Partial<AuthError>;
  if (authError.code === 'invalid_credentials') return t('error.loginInvalid');
  if (authError.code === 'user_not_found') return t('error.userNotFound');
  if (authError.code === 'email_not_confirmed') return t('error.emailNotConfirmed');
  if (authError.code === 'email_address_invalid') return t('error.emailInvalid');
  if (authError.status === 0 || authError.message?.toLowerCase().includes('fetch')) return t('error.network');
  return t('error.login');
}

export function getRegistrationError(error: unknown, t: Translate) {
  if (error instanceof Error && error.message.startsWith('USERNAME:')) return t(usernameIssueKey(error.message.slice('USERNAME:'.length) as UsernameIssue), { min: 2, max: 18 });
  if (error instanceof Error && error.message === 'EMAIL_ALREADY_REGISTERED') {
    return t('error.emailExists');
  }

  const authError = error as Partial<AuthError>;
  if (authError.code === 'email_exists' || authError.code === 'user_already_exists') {
    return t('error.emailExists');
  }
  if (authError.code === 'email_address_invalid') {
    return t('error.emailInvalid');
  }
  if (authError.code === 'email_provider_disabled') {
    return t('error.emailSignupDisabled');
  }
  if (authError.code === 'weak_password') {
    return t('error.weakPassword');
  }
  if (authError.code === 'over_email_send_rate_limit') {
    return t('error.tooManyAttempts');
  }
  if (authError.code === 'signup_disabled') {
    return t('error.signupDisabled');
  }
  if (authError.status === 0 || authError.message?.toLowerCase().includes('fetch')) {
    return t('error.network');
  }
  return t('error.signup');
}
