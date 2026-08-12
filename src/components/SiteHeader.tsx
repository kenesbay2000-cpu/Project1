import { Link } from 'wouter';

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Roamly — на главную">
        <span className="brand__mark">R</span>
        <span>Roamly<small>smart travel</small></span>
      </Link>
      <nav aria-label="Основная навигация">
        <a href="#ideas">Направления</a>
        <a href="#planner">Как это работает</a>
      </nav>
      <button className="header-action" type="button">Мои поездки <span>→</span></button>
    </header>
  );
}
