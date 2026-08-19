import { RegistrationForm } from '../components/Auth';
import './SignupPage.css';
import { useI18n } from '../i18n/I18nProvider';

export function SignupPage() {
  const { t } = useI18n();
  return (
    <main className="signup-page">
      <aside className="signup-story">
        <div>
          <p>Roamly account</p>
          <h2>{t('signup.storyTitle')}</h2>
        </div>
        <blockquote>{t('signup.quote')}</blockquote>
        <div className="signup-story__facts"><span><b>8</b> {t('login.destinations')}</span><span><b>1</b> {t('signup.planner')}</span></div>
      </aside>
      <div className="signup-form-wrap"><RegistrationForm /></div>
    </main>
  );
}
