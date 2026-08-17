import type { ReactNode } from 'react';
import '../pages/SignupPage.css';
import './RecoveryPageLayout.css';

type RecoveryPageLayoutProps = {
  children: ReactNode;
  storyTitle: string;
  storyText: string;
};

export function RecoveryPageLayout({ children, storyTitle, storyText }: RecoveryPageLayoutProps) {
  return (
    <main className="signup-page recovery-page">
      <aside className="signup-story recovery-story">
        <div><p>Roamly account</p><h2>{storyTitle}</h2></div>
        <blockquote>«{storyText}»</blockquote>
        <div className="signup-story__facts"><span><b>1</b> защищённый аккаунт</span><span><b>∞</b> новых маршрутов</span></div>
      </aside>
      <div className="signup-form-wrap">{children}</div>
    </main>
  );
}
