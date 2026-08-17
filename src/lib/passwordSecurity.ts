export type PasswordStrength = {
  level: 'weak' | 'medium' | 'strong';
  label: 'Слабый' | 'Средний' | 'Надёжный';
  score: number;
  isAcceptable: boolean;
  hints: string[];
};

const commonPatterns = /password|qwerty|12345|пароль|admin|letmein/i;

export function evaluatePassword(password: string): PasswordStrength {
  const hasLowercase = /[a-zа-яё]/.test(password);
  const hasUppercase = /[A-ZА-ЯЁ]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^\p{L}\p{N}\s]/u.test(password);
  const characterGroups = [hasLowercase, hasUppercase, hasNumber, hasSymbol].filter(Boolean).length;
  const hasCommonPattern = commonPatterns.test(password) || /(.)\1{3,}/.test(password);
  let score = 0;
  if (password.length >= 10) score += 1;
  if (password.length >= 14) score += 1;
  if (characterGroups >= 3) score += 2;
  if (characterGroups === 4) score += 1;
  if (hasCommonPattern) score = Math.max(0, score - 2);

  const hints = [];
  if (password.length < 10) hints.push('минимум 10 символов');
  if (characterGroups < 3) hints.push('буквы разного регистра, цифры или символы');
  if (hasCommonPattern) hints.push('без простых последовательностей и повторов');
  const isAcceptable = password.length >= 10 && characterGroups >= 3 && !hasCommonPattern;
  if (!password) return { level: 'weak', label: 'Слабый', score: 0, isAcceptable: false, hints };
  if (score >= 5 && isAcceptable) return { level: 'strong', label: 'Надёжный', score: 3, isAcceptable, hints };
  if (score >= 3 && isAcceptable) return { level: 'medium', label: 'Средний', score: 2, isAcceptable, hints };
  return { level: 'weak', label: 'Слабый', score: 1, isAcceptable: false, hints };
}
