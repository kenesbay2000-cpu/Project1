import { useState } from 'react';
import { useLocation } from 'wouter';
import { AccountProfileForm } from '../components/AccountProfileForm';
import { useAuth } from '../components/AuthProvider';
import { ProtectedPage } from '../components/ProtectedPage';
import { PasswordSettings } from '../components/PasswordSettings';
import './ProfilePage.css';

export function ProfilePage() {
  const { user, displayName, signOut } = useAuth();
  const [, navigate] = useLocation();
  const [logoutError, setLogoutError] = useState('');

  async function handleSignOut() {
    try { setLogoutError(''); await signOut(); navigate('/'); }
    catch { setLogoutError('Не удалось выйти. Проверьте интернет и попробуйте снова.'); }
  }

  return (
    <ProtectedPage label="Профиль" guestDescription="Ваш профиль доступен после авторизации.">
      <main className="account-page">
        <header className="account-hero"><div><p>Ваш профиль</p><h1>Рады видеть,<br /><em>{displayName}</em></h1></div><p>Здесь можно изменить отображаемое имя и управлять текущей сессией аккаунта.</p></header>
        <div className="account-layout">
          <AccountProfileForm />
          <aside className="account-session"><p>Сессия</p><h2>Безопасность аккаунта</h2><span>Вы вошли как<br /><b>{user?.email}</b></span><button type="button" onClick={handleSignOut}>Выйти из аккаунта <span>→</span></button>{logoutError && <small role="alert">{logoutError}</small>}</aside>
          <PasswordSettings />
        </div>
      </main>
    </ProtectedPage>
  );
}
