import { useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from './AuthProvider';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useI18n } from '../i18n/I18nProvider';
import type { TranslationKey } from '../i18n/translations';

const navigation: Array<{ href: string; label: TranslationKey }> = [
  { href: '/', label: 'header.home' },
  { href: '/planner', label: 'header.planner' },
  { href: '/blog', label: 'header.blog' },
];

export function SiteHeader() {
  const [location] = useLocation();
  const { user, isLoading } = useAuth();
  const { t } = useI18n();
  const headerRef = useRef<HTMLElement>(null);
  const isHome = location === '/';
  const isDestinationArticle = /^\/destinations\/[^/]+$/.test(location);
  const startsOnDark = isHome || isDestinationArticle || location === '/planner';
  const [theme, setTheme] = useState<'dark' | 'light'>(startsOnDark ? 'dark' : 'light');
  const [isAtTop, setIsAtTop] = useState(true);

  useLayoutEffect(() => {
    let updateTimer = 0;

    const updateTheme = () => {
      updateTimer = 0;
      const header = headerRef.current;
      if (!header) return;
      const sampleY = Math.min(window.innerHeight - 1, Math.ceil(header.getBoundingClientRect().bottom) + 1);
      const elements = document.elementsFromPoint(window.innerWidth / 2, sampleY);
      let nextTheme: 'dark' | 'light' = 'light';

      for (const element of elements) {
        if (header.contains(element)) continue;
        const themedSection = element.closest<HTMLElement>('[data-header-theme]');
        const declaredTheme = themedSection?.dataset.headerTheme;
        if (declaredTheme === 'dark' || declaredTheme === 'light') {
          nextTheme = declaredTheme;
          break;
        }
      }

      setTheme(nextTheme);
      setIsAtTop(window.scrollY < 12);
    };

    const scheduleUpdate = () => {
      if (!updateTimer) updateTimer = window.setTimeout(updateTheme, 32);
    };

    const observer = new MutationObserver(scheduleUpdate);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-header-theme', 'data-header-overlay'] });
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });
    updateTheme();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (updateTimer) window.clearTimeout(updateTimer);
    };
  }, [location]);

  return (
    <header ref={headerRef} className={`site-header site-header--${theme}${isAtTop ? ' site-header--top' : ' site-header--scrolled'}`}>
      <Link className="brand" href="/" aria-label={t('header.brandHome')}>
        <span className="brand__mark">R</span>
        <span>Roamly<small>{t('header.tagline')}</small></span>
      </Link>
      <nav aria-label={t('header.mainNavigation')}>
        {navigation.map((item) => {
          const isActive = item.href === '/' ? isHome : location.startsWith(item.href);
          return <Link className={isActive ? 'is-active' : ''} href={item.href} key={item.href}>{t(item.label)}</Link>;
        })}
        <div className="header-auth" aria-live="polite">
          {isLoading ? <span className="header-auth__loading" aria-label={t('header.authLoading')} /> : user ? (
            <>
              <Link className={location === '/profile' || location === '/account' ? 'is-active' : ''} href="/profile">{t('header.profile')}</Link>
              <Link className={location.startsWith('/my-plans') ? 'is-active' : ''} href="/my-plans">{t('header.myPlans')}</Link>
            </>
          ) : (
            <><Link href="/login">{t('header.login')}</Link><Link className="header-auth__signup" href="/signup">{t('header.signup')}</Link></>
          )}
        </div>
      </nav>
      <LanguageSwitcher />
      <Link className="header-action" href="/planner">{t('header.startPlanning')} <span>→</span></Link>
    </header>
  );
}
