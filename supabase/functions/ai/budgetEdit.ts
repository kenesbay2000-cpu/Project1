import { convertCurrency } from './budgetPolicy.ts';
import type { CurrencyRates } from './exchangeRates.ts';
import { SUPPORTED_CURRENCIES } from './currencies.ts';
import type { PlannerRequest, TripPlan } from './types.ts';

export type BudgetEdit = { request: PlannerRequest; target: number; currency: string; description: string };

function detectCurrency(command: string, fallback: string) {
  const code = command.match(new RegExp(`\\b(${SUPPORTED_CURRENCIES.join('|')})\\b`, 'i'))?.[1]?.toUpperCase();
  if (code) return code;
  if (/\$|\bUSD\b|доллар/i.test(command)) return 'USD';
  if (/€|\bEUR\b|евро/i.test(command)) return 'EUR';
  if (/₸|\bKZT\b|тенге/i.test(command)) return 'KZT';
  if (/₽|рубл|ruble/i.test(command)) return 'RUB';
  if (/юан|yuan|renminbi/i.test(command)) return 'CNY';
  if (/£|фунт|pound/i.test(command)) return 'GBP';
  if (/₺|лир|lira/i.test(command)) return 'TRY';
  if (/฿|бат|baht/i.test(command)) return 'THB';
  if (/₩|вон|won/i.test(command)) return 'KRW';
  if (/₫|донг|dong/i.test(command)) return 'VND';
  return fallback.toUpperCase();
}

function commandAmount(command: string) {
  const match = command.match(/(?:\$|€|£|₸|₽|₹|₺|₩|฿|₫)?\s*(\d[\d\s.,]*)/i);
  if (!match) return null;
  const normalized = match[1].replace(/[\s,]/g, '');
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export function applyBudgetCommand(request: PlannerRequest, plan: TripPlan, command: string, rates: CurrencyRates): BudgetEdit | null {
  if (!/(?:бюдж|дешев|эконом|сниз\S*\s+(?:цен|стоим)|budget|cheaper|save)/i.test(command)) return null;
  const planCurrency = plan.budget.currency.toUpperCase();
  const statedCurrency = detectCurrency(command, planCurrency);
  const amount = commandAmount(command);
  const isReduction = /(?:на\s+(?:\$|€|£|₸|₽|₺|₩|฿|₫)?\s*\d|дешевле\s+на|cheaper\s+by|save\s+)/i.test(command);
  let targetCurrency = isReduction ? planCurrency : statedCurrency;
  let target: number;

  if (isReduction && amount) {
    const reduction = convertCurrency(amount, statedCurrency, planCurrency, rates);
    if (reduction === null) return null;
    target = Math.max(0, plan.budget.total - reduction);
  } else if (amount) {
    target = amount;
  } else {
    targetCurrency = planCurrency;
    target = plan.budget.total * 0.85;
  }
  target = Math.round(target);
  const previousMin = request.priceRange
    ? convertCurrency(request.priceRange.min, request.priceRange.currency, targetCurrency, rates) ?? 0
    : 0;
  const priceRange = { min: Math.min(Math.round(previousMin), target), max: target, currency: targetCurrency };
  const confirmedSummary = request.confirmedSummary ? {
    ...request.confirmedSummary,
    budget: priceRange,
  } : undefined;
  return {
    request: { ...request, priceRange, confirmedSummary },
    target,
    currency: targetCurrency,
    description: `${target.toLocaleString('ru-RU')} ${targetCurrency}`,
  };
}
