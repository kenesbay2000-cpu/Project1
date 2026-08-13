import { LoginForm } from '../components/LoginForm';
import './SignupPage.css';

export function LoginPage() {
  return (
    <main className="signup-page login-page">
      <aside className="signup-story login-story">
        <div><p>Roamly account</p><h2>Ваши планы ждут продолжения.</h2></div>
        <blockquote>«Возвращаться приятно, когда впереди уже намечено новое путешествие».</blockquote>
        <div className="signup-story__facts"><span><b>8</b> направлений</span><span><b>1</b> личное пространство</span></div>
      </aside>
      <div className="signup-form-wrap"><LoginForm /></div>
    </main>
  );
}
