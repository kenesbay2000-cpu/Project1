export const MIN_USERNAME_LENGTH = 2;
export const MAX_USERNAME_LENGTH = 18;

const RU_BLOCKED = [
  /ху[йеяиюё]/u, /п[ие]зд/u, /бл[яе]д/u, /[её]б(?:а|у|л|н|т|уч|ыр)/u,
  /мудак/u, /долбо[её]б/u, /гандон/u, /шлюх/u, /мраз/u, /сук[аи]/u,
];

const EN_BLOCKED = [
  /fuck/u, /shit/u, /bitch/u, /cunt/u, /asshole/u, /dickhead/u,
  /motherfucker/u, /whore/u, /slut/u, /faggot/u, /nigg(?:er|a)/u,
];

function normalizeForModeration(value: string) {
  return value.normalize('NFKC').toLowerCase().replace(/ё/g, 'е').replace(/[013457@$!]/g, (char) => ({
    '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's', '!': 'i',
  })[char] ?? char);
}

function toCyrillicLookalikes(value: string) {
  return value.replace(/[aeopcyxkmbt]/g, (char) => ({ a: 'а', e: 'е', o: 'о', p: 'р', c: 'с', y: 'у', x: 'х', k: 'к', m: 'м', b: 'в', t: 'т' })[char] ?? char);
}

function toLatinLookalikes(value: string) {
  return value.replace(/[аеорсухкмвт]/g, (char) => ({ а: 'a', е: 'e', о: 'o', р: 'p', с: 'c', у: 'y', х: 'x', к: 'k', м: 'm', в: 'b', т: 't' })[char] ?? char);
}

export function getUsernameLength(value: string) {
  return Array.from(value.trim()).length;
}

export function validateUsername(value: string): string | null {
  const name = value.trim().replace(/\s+/g, ' ');
  const length = getUsernameLength(name);
  if (length < MIN_USERNAME_LENGTH) return `Имя должно содержать минимум ${MIN_USERNAME_LENGTH} символа.`;
  if (length > MAX_USERNAME_LENGTH) return `Имя должно быть не длиннее ${MAX_USERNAME_LENGTH} символов.`;
  if (!/^[\p{L}\p{N}][\p{L}\p{M}\p{N} .'-]*$/u.test(name)) {
    return 'Используйте только буквы, цифры, пробел, точку, дефис или апостроф.';
  }

  const normalized = normalizeForModeration(name);
  const compact = normalized.replace(/[^\p{L}\p{N}]/gu, '');
  const moderationForms = [compact, toCyrillicLookalikes(compact), toLatinLookalikes(compact)];
  if (moderationForms.some((form) => [...RU_BLOCKED, ...EN_BLOCKED].some((pattern) => pattern.test(form)))) {
    return 'Это имя содержит неприемлемые слова. Пожалуйста, выберите другое имя.';
  }
  return null;
}

export function normalizeUsername(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

export function getSafeDisplayName(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback;
  const normalized = normalizeUsername(value);
  return validateUsername(normalized) ? fallback : normalized;
}
