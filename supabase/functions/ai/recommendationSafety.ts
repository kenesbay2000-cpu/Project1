import type { AccommodationOption, TripPlan } from './types.ts';

export const RECOMMENDATION_SAFETY_GUIDANCE =
  'Безопасность рекомендаций: не предлагай малоизвестные или непроверяемые площадки бронирования. Если цена жилья, транспорта или активности выглядит подозрительно низкой и это не объяснено форматом, сезоном или условиями, добавь к соответствующей рекомендации одну короткую нейтральную просьбу перепроверить условия, отзывы и возврат перед оплатой. Не называй компанию, сайт или продавца мошенниками без подтверждённых оснований.';

const LOW_PRICE_FLOORS: Record<string, number> = {
  EUR: 10,
  GBP: 9,
  KZT: 5_000,
  RUB: 900,
  USD: 10,
};

const EXPLAINED_LOW_PRICE = /хостел|общ(?:ая|ий) комнат|гостев(?:ой|ая) дом|вне центр|окраин|капсул|без завтрак|базов|hostel|shared|guesthouse|outskirts|capsule|no breakfast|basic/i;
const EXTERNAL_SITE = /(?:https?:\/\/|www\.|\b[a-z0-9][a-z0-9-]{1,62}\.(?:com|net|org|io|app|site|travel|booking|xyz)\b)/i;
const ALREADY_CAUTIOUS = /перепроверь|проверьте.*(?:отзыв|услов|возврат)|verify|double-check/i;

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

function addAccommodationCaution(
  option: AccommodationOption,
  typicalPrice: number,
  currency: string,
  language: 'ru' | 'en',
): AccommodationOption {
  if (ALREADY_CAUTIOUS.test(option.description)) return option;
  const text = `${option.name} ${option.type} ${option.description}`;
  const hasExternalSite = EXTERNAL_SITE.test(text);
  const floor = LOW_PRICE_FLOORS[currency];
  const unusuallyCheap = option.pricePerNight <= 0
    || (typicalPrice > 0 && option.pricePerNight < typicalPrice * 0.45)
    || (floor !== undefined && option.pricePerNight < floor);
  if (!hasExternalSite && (!unusuallyCheap || EXPLAINED_LOW_PRICE.test(text))) return option;

  const warning = language === 'en'
    ? hasExternalSite ? 'Before paying, verify the platform, booking terms, reviews, and refund policy through independent sources.' : 'This price is notably lower than the alternatives — verify the terms, address, reviews, and refund policy before paying.'
    : hasExternalSite ? 'Перед оплатой перепроверьте площадку, условия бронирования, отзывы и правила возврата через независимые источники.' : 'Цена заметно ниже других вариантов — перед оплатой перепроверьте условия, адрес, отзывы и правила возврата.';
  return { ...option, description: `${option.description} ${warning}` };
}

export function applyRecommendationCautions(plan: TripPlan, language: 'ru' | 'en' = 'ru'): TripPlan {
  const typicalPrice = median(plan.accommodations.map((item) => item.pricePerNight).filter((price) => price > 0));
  const currency = plan.budget.currency.toUpperCase();
  const accommodations = plan.accommodations.map((item) => addAccommodationCaution(item, typicalPrice, currency, language));
  return accommodations.every((item, index) => item === plan.accommodations[index])
    ? plan
    : { ...plan, accommodations };
}
