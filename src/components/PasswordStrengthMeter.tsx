import type { PasswordStrength } from '../lib/passwordSecurity';

type PasswordStrengthMeterProps = {
  strength: PasswordStrength;
  hasPassword: boolean;
};

export function PasswordStrengthMeter({ strength, hasPassword }: PasswordStrengthMeterProps) {
  if (!hasPassword) return <p className="password-strength__hint">Используйте минимум 10 символов и сочетайте три типа знаков.</p>;
  return (
    <div className={`password-strength password-strength--${strength.level}`} aria-live="polite">
      <div>{[1, 2, 3].map((step) => <span className={step <= strength.score ? 'is-filled' : ''} key={step} />)}</div>
      <p>Надёжность: <strong>{strength.label}</strong>{strength.hints.length > 0 ? ` · Добавьте: ${strength.hints.join(', ')}` : ''}</p>
    </div>
  );
}
