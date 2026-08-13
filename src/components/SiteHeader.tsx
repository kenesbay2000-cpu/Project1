import { Link, useLocation } from 'wouter';

const navigation = [
  { href: '/', label: 'Главная' },
  { href: '/destinations', label: 'Направления' },
  { href: '/map', label: 'Карта' },
  { href: '/planner', label: 'AI Planner' },
  { href: '/blog', label: 'Блог' },
  { href: '/signup', label: 'Аккаунт' },
];

export function SiteHeader() {
  const [location] = useLocation();
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
      </nav>
      <Link className="header-action" href="/signup">Создать аккаунт <span>→</span></Link>
    </header>
  );
}
