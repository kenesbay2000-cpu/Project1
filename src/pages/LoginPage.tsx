import { LoginForm } from '../components/LoginForm';
import './SignupPage.css';
import { useI18n } from '../i18n/I18nProvider';

export function LoginPage() {
  const { t } = useI18n();
  return (
    <main className="signup-page login-page">
      <aside className="signup-story login-story">
        <div><p>Roamly account</p><h2>{t('login.storyTitle')}</h2></div>
        <blockquote>{t('login.quote')}</blockquote>
        <div className="signup-story__facts"><span><b>8</b> {t('login.destinations')}</span><span><b>1</b> {t('login.space')}</span></div>
      </aside>
      <div className="signup-form-wrap"><LoginForm /></div>
    </main>
  );
}
