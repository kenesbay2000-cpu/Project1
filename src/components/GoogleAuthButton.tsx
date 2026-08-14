import { useState } from 'react';
import { getLoginError, signInWithGoogle } from '../lib/auth';
import { hasPendingTrip } from '../lib/savedPlans';

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.1 5.1 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#fbbc05" d="M5.84 14.09A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84Z" />
      <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.6 10.6 0 0 0 12 1 11 11 0 0 0 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" />
    </svg>
  );
}

export function GoogleAuthButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleGoogleSignIn() {
    setBusy(true);
    setError('');
    try {
      await signInWithGoogle(hasPendingTrip() ? '/planner' : '/');
    } catch (oauthError) {
      setError(getLoginError(oauthError));
      setBusy(false);
    }
  }

  return (
    <div className="google-auth">
      <div className="auth-divider"><span>или</span></div>
      <button className="google-auth__button" type="button" onClick={handleGoogleSignIn} disabled={busy}>
        <GoogleIcon />
        <span>{busy ? 'Открываем Google…' : 'Войти через Google'}</span>
      </button>
      {error && <p className="registration-error" role="alert">{error}</p>}
    </div>
  );
}
