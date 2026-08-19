import type { PlannerRequest, TripPlan } from './types.ts';

type BudgetLevel = 'none' | 'sufficient' | 'tight' | 'absurdly_low';

export type BudgetAssessment = {
  level: BudgetLevel;
  maximumInUsd: number | null;
  maximumLabel: string;
};

// Conservative reference rates based on National Bank of Kazakhstan daily rates, August 2026.
// Hard rejection uses a deliberately low threshold, so normal market movement cannot trigger it.
const USD_PER_UNIT: Record<string, number> = { USD: 1, EUR: 1.15, KZT: 1 / 475 };

export function convertCurrency(amount: number, from: string, to: string) {
  const fromRate = USD_PER_UNIT[from.toUpperCase()];
  const toRate = USD_PER_UNIT[to.toUpperCase()];
  return fromRate && toRate ? amount * fromRate / toRate : null;
}

function tripDays(request: PlannerRequest) {
  if (!request.dates) return 7;
  return Math.round((Date.parse(`${request.dates.end}T00:00:00Z`)
    - Date.parse(`${request.dates.start}T00:00:00Z`)) / 86_400_000) + 1;
}

export function assessBudget(request: PlannerRequest): BudgetAssessment {
  if (!request.priceRange) return { level: 'none', maximumInUsd: null, maximumLabel: 'не указан' };
  const { max, currency } = request.priceRange;
  const rate = USD_PER_UNIT[currency];
  const maximumLabel = `${max.toLocaleString('en-US')} ${currency}`;
  if (!rate) return { level: 'sufficient', maximumInUsd: null, maximumLabel };

  const maximumInUsd = max * rate;
  const travelers = request.travelers ?? 1;
  const days = tripDays(request);
  const absurdFloor = travelers * (days * 12 + 50);
  const tightFloor = travelers * (days * 45 + 250);
  const level = maximumInUsd < absurdFloor
    ? 'absurdly_low'
    : maximumInUsd < tightFloor ? 'tight' : 'sufficient';
  return { level, maximumInUsd, maximumLabel };
}

export function budgetPromptGuidance(assessment: BudgetAssessment) {
  if (assessment.level === 'none') return 'Жёсткого ограничения бюджета нет.';
  const converted = assessment.maximumInUsd === null
    ? ''
    : ` (примерно ${Math.round(assessment.maximumInUsd)} USD по справочному курсу)`;
  if (assessment.level === 'tight') {
    return `Верхняя граница ${assessment.maximumLabel}${converted} плотная, но не является причиной отказа. Обязательно верни success, выбери бюджетные варианты и добавь мягкое предупреждение в realism.`;
  }
  return `Верхняя граница ${assessment.maximumLabel}${converted} признана достаточной. Не возвращай budget_too_low; ориентируйся прежде всего на максимум диапазона.`;
}

export function applyBudgetWarning(plan: TripPlan, assessment: BudgetAssessment, language: 'ru' | 'en' = 'ru') {
  if (assessment.level !== 'tight') return plan;
  const warning = language === 'en' ? 'This is a tight budget for the trip. Prioritise more affordable stays, transport, and activities while keeping a small reserve.' : 'Бюджет достаточно плотный для такой поездки. Стоит выбирать более доступное жильё, транспорт и активности, оставив небольшой резерв.';
  const adjustment = language === 'en' ? 'The itinerary was adapted to the upper budget limit, prioritising good-value options.' : 'План адаптирован под верхнюю границу бюджета с приоритетом бюджетных вариантов.';
  return {
    ...plan,
    realism: {
      status: 'adjusted' as const,
      warning: plan.realism.warning ? `${plan.realism.warning} ${warning}` : warning,
      adjustments: plan.realism.adjustments.includes(adjustment)
        ? plan.realism.adjustments
        : [...plan.realism.adjustments, adjustment],
    },
  };
}
