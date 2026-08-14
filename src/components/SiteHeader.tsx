import { Link, useLocation } from 'wouter';
import { useAuth } from './AuthProvider';

const navigation = [
  { href: '/', label: 'Главная' },
  { href: '/destinations', label: 'Направления' },
  { href: '/map', label: 'Карта' },
  { href: '/planner', label: 'AI Planner' },
  { href: '/blog', label: 'Блог' },
];

export function SiteHeader() {
  const [location] = useLocation();
  const { user, isLoading } = useAuth();
  const isHome = location === '/';
  const isDestinationArticle = /^\/destinations\/[^/]+$/.test(location);
  const isOverlay = isHome || isDestinationArticle;

  return (
    <header className={`site-header ${isOverlay ? 'site-header--overlay' : 'site-header--light'}`}>
      <Link className="brand" href="/" aria-label="Roamly — на главную">
        <span className="brand__mark">R</span>
        <span>Roamly<small>smart travel</small></span>
      </Link>
      <nav aria-label="Основная навигация">
        {navigation.map((item) => {
          const isActive = item.href === '/' ? isHome : location.startsWith(item.href);
          return <Link className={isActive ? 'is-active' : ''} href={item.href} key={item.href}>{item.label}</Link>;
        })}
        <div className="header-auth" aria-live="polite">
          {isLoading ? <span className="header-auth__loading" aria-label="Проверяем авторизацию" /> : user ? (
            <>
              <Link className={location === '/profile' || location === '/account' ? 'is-active' : ''} href="/profile">Профиль</Link>
              <Link className={location.startsWith('/my-plans') ? 'is-active' : ''} href="/my-plans">Мои планы</Link>
            </>
          ) : (
            <><Link href="/login">Войти</Link><Link className="header-auth__signup" href="/signup">Регистрация</Link></>
          )}
        </div>
      </nav>
      <Link className="header-action" href="/planner">Начать планировать <span>→</span></Link>
    </header>
  );
}
