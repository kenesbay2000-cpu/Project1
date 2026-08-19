import { useState } from 'react';
import { useLocation } from 'wouter';
import { AccountProfileForm } from '../components/AccountProfileForm';
import { useAuth } from '../components/AuthProvider';
import { ProtectedPage } from '../components/ProtectedPage';
import { PasswordSettings } from '../components/PasswordSettings';
import { TravelPreferencesSettings } from '../components/TravelPreferencesSettings';
import './ProfilePage.css';
import { useI18n } from '../i18n/I18nProvider';

export function ProfilePage() {
  const { t } = useI18n();
  const { user, displayName, signOut } = useAuth();
  const [, navigate] = useLocation();
  const [logoutError, setLogoutError] = useState('');

  async function handleSignOut() {
    try { setLogoutError(''); await signOut(); navigate('/'); }
    catch { setLogoutError(t('profile.logoutError')); }
  }

  return (
    <ProtectedPage label={t('profile.label')} guestDescription={t('profile.guest')}>
      <main className="account-page">
        <header className="account-hero"><div><p>{t('profile.eyebrow')}</p><h1>{t('profile.hello')}<br /><em>{displayName}</em></h1></div><p>{t('profile.intro')}</p></header>
        <div className="account-layout">
          <AccountProfileForm />
          <aside className="account-session"><p>{t('profile.session')}</p><h2>{t('profile.security')}</h2><span>{t('profile.signedAs')}<br /><b>{user?.email}</b></span><button type="button" onClick={handleSignOut}>{t('profile.logout')} <span>→</span></button>{logoutError && <small role="alert">{logoutError}</small>}</aside>
          <PasswordSettings />
          <TravelPreferencesSettings />
        </div>
      </main>
    </ProtectedPage>
  );
}
