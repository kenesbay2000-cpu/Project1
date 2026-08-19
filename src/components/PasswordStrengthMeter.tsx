import type { PasswordStrength } from '../lib/passwordSecurity';
import { useI18n } from '../i18n/I18nProvider';

type PasswordStrengthMeterProps = {
  strength: PasswordStrength;
  hasPassword: boolean;
};

export function PasswordStrengthMeter({ strength, hasPassword }: PasswordStrengthMeterProps) {
  const { t } = useI18n();
  if (!hasPassword) return <p className="password-strength__hint">{t('password.emptyHint')}</p>;
  const label = strength.level === 'strong' ? t('password.levelStrong') : strength.level === 'medium' ? t('password.levelMedium') : t('password.levelWeak');
  const hints = strength.hints.map((hint) => hint === 'минимум 10 символов' ? t('password.hintLength') : hint.startsWith('буквы') ? t('password.hintGroups') : t('password.hintPatterns'));
  return (
    <div className={`password-strength password-strength--${strength.level}`} aria-live="polite">
      <div>{[1, 2, 3].map((step) => <span className={step <= strength.score ? 'is-filled' : ''} key={step} />)}</div>
      <p>{t('password.strengthHint')}: <strong>{label}</strong>{hints.length > 0 ? ` · ${t('password.add', { items: hints.join(', ') })}` : ''}</p>
    </div>
  );
}
