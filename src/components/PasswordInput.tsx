import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';

type PasswordInputProps = {
  id: string;
  label: string;
  value: string;
  autoComplete: string;
  error?: string;
  onChange: (value: string) => void;
};

export function PasswordInput({ id, label, value, autoComplete, error, onChange }: PasswordInputProps) {
  const { t } = useI18n();
  const [isVisible, setIsVisible] = useState(false);
  return (
    <label className={error ? 'password-control has-error' : 'password-control'} htmlFor={id}>
      <span>{label}</span>
      <div>
        <input id={id} type={isVisible ? 'text' : 'password'} value={value} autoComplete={autoComplete} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
        <button type="button" onClick={() => setIsVisible((visible) => !visible)}>{isVisible ? t('auth.hide') : t('auth.show')}</button>
      </div>
      {error && <small id={`${id}-error`}>{error}</small>}
    </label>
  );
}
