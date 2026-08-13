import { RegistrationForm } from '../components/Auth';
import './SignupPage.css';

export function SignupPage() {
  return (
    <main className="signup-page">
      <aside className="signup-story">
        <div>
          <p>Roamly account</p>
          <h2>Мир становится ближе, когда планы собраны.</h2>
        </div>
        <blockquote>«Хорошее путешествие начинается не с билета, а с идеи, которую хочется сохранить».</blockquote>
        <div className="signup-story__facts"><span><b>8</b> направлений</span><span><b>1</b> умный планировщик</span></div>
      </aside>
      <div className="signup-form-wrap"><RegistrationForm /></div>
    </main>
  );
}
