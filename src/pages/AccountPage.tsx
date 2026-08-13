import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { AccountProfileForm } from '../components/AccountProfileForm';
import { useAuth } from '../components/AuthProvider';
import './AccountPage.css';

export function AccountPage() {
  const { user, displayName, isLoading, signOut } = useAuth();
  const [, navigate] = useLocation();
  const [logoutError, setLogoutError] = useState('');

  if (isLoading) return <main className="account-page account-page--loading"><span /></main>;
  if (!user) return (
    <main className="account-page account-page--guest"><section><p>Личный кабинет</p><h1>Сначала войдите</h1><span>Ваш профиль доступен после авторизации.</span><Link href="/login">Перейти ко входу →</Link></section></main>
  );

  async function handleSignOut() {
    try { setLogoutError(''); await signOut(); navigate('/'); }
    catch { setLogoutError('Не удалось выйти. Проверьте интернет и попробуйте снова.'); }
  }

  return (
    <main className="account-page">
      <header className="account-hero"><div><p>Личный кабинет</p><h1>Рады видеть,<br /><em>{displayName}</em></h1></div><p>Здесь живут данные вашего аккаунта. Скоро здесь появятся сохранённые маршруты и любимые направления.</p></header>
      <div className="account-layout">
        <AccountProfileForm />
        <aside className="account-session"><p>Сессия</p><h2>Безопасность аккаунта</h2><span>Вы вошли как<br /><b>{user.email}</b></span><button type="button" onClick={handleSignOut}>Выйти из аккаунта <span>→</span></button>{logoutError && <small role="alert">{logoutError}</small>}</aside>
      </div>
    </main>
  );
}
