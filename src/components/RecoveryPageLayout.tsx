import type { ReactNode } from 'react';
import '../pages/SignupPage.css';
import './RecoveryPageLayout.css';
import { useI18n } from '../i18n/I18nProvider';

type RecoveryPageLayoutProps = {
  children: ReactNode;
  storyTitle: string;
  storyText: string;
};

export function RecoveryPageLayout({ children, storyTitle, storyText }: RecoveryPageLayoutProps) {
  const { t } = useI18n();
  return (
    <main className="signup-page recovery-page">
      <aside className="signup-story recovery-story">
        <div><p>{t('auth.accountLabel')}</p><h2>{storyTitle}</h2></div>
        <blockquote>«{storyText}»</blockquote>
        <div className="signup-story__facts"><span><b>1</b> {t('recovery.secureAccount')}</span><span><b>∞</b> {t('recovery.newRoutes')}</span></div>
      </aside>
      <div className="signup-form-wrap">{children}</div>
    </main>
  );
}
