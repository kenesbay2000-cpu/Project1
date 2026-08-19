export const supportedCurrencies = [
  'KZT', 'USD', 'EUR', 'RUB', 'CNY', 'GBP', 'TRY', 'THB', 'KRW', 'VND',
] as const;

export type CurrencyCode = typeof supportedCurrencies[number];

export const budgetSettings: Record<CurrencyCode, { min: number; max: number; limit: number; step: number }> = {
  KZT: { min: 300_000, max: 1_200_000, limit: 5_000_000, step: 50_000 },
  USD: { min: 1_000, max: 4_000, limit: 30_000, step: 100 },
  EUR: { min: 1_000, max: 4_000, limit: 30_000, step: 100 },
  RUB: { min: 80_000, max: 320_000, limit: 2_400_000, step: 10_000 },
  CNY: { min: 7_000, max: 28_000, limit: 210_000, step: 1_000 },
  GBP: { min: 800, max: 3_200, limit: 24_000, step: 100 },
  TRY: { min: 40_000, max: 160_000, limit: 1_200_000, step: 5_000 },
  THB: { min: 35_000, max: 140_000, limit: 1_000_000, step: 5_000 },
  KRW: { min: 1_400_000, max: 5_500_000, limit: 40_000_000, step: 100_000 },
  VND: { min: 26_000_000, max: 105_000_000, limit: 800_000_000, step: 5_000_000 },
};

const currencyNames: Record<'ru' | 'en', Record<CurrencyCode, string>> = {
  ru: { KZT: 'Казахстанский тенге', USD: 'Доллар США', EUR: 'Евро', RUB: 'Российский рубль', CNY: 'Китайский юань', GBP: 'Фунт стерлингов', TRY: 'Турецкая лира', THB: 'Тайский бат', KRW: 'Южнокорейская вона', VND: 'Вьетнамский донг' },
  en: { KZT: 'Kazakhstani tenge', USD: 'US dollar', EUR: 'Euro', RUB: 'Russian ruble', CNY: 'Chinese yuan', GBP: 'Pound sterling', TRY: 'Turkish lira', THB: 'Thai baht', KRW: 'South Korean won', VND: 'Vietnamese dong' },
};

export function currencyName(code: CurrencyCode, language: 'ru' | 'en') {
  return currencyNames[language][code];
}
