export const SUPPORTED_CURRENCIES = [
  'KZT', 'USD', 'EUR', 'RUB', 'CNY', 'GBP', 'TRY', 'THB', 'KRW', 'VND',
] as const;

export function isSupportedCurrency(value: string) {
  return SUPPORTED_CURRENCIES.some((currency) => currency === value);
}
