import { parsePlannerAIResult } from './aiResult.ts';
import { applyBudgetWarning, assessBudget, budgetPromptGuidance } from './budgetPolicy.ts';
import { requestGemini } from './gemini.ts';
import { applyBudgetCommand, type BudgetEdit } from './budgetEdit.ts';
import type { PlannerRequest, TripPlan } from './types.ts';
import { RECOMMENDATION_SAFETY_GUIDANCE } from './recommendationSafety.ts';
import { localizedPlannerText, responseLanguageInstruction } from './responseLanguage.ts';
import type { CurrencyRates } from './exchangeRates.ts';

type EditFailure = { ok: false; code: string; message: string; status: number };
type EditSuccess = { ok: true; plan: TripPlan; request: PlannerRequest };

function wordNumber(value: string) {
  const words: Record<string, number> = { один: 1, одну: 1, два: 2, две: 2, три: 3, four: 4, one: 1, two: 2, three: 3 };
  return /^\d+$/.test(value) ? Number(value) : words[value.toLowerCase()] ?? 0;
}

function requestedDayDelta(command: string) {
  const match = command.match(/(\d+|один|одну|два|две|три|one|two|three|four)\s*(?:дн(?:я|ей)?|days?)/i);
  if (!match) return 0;
  const amount = wordNumber(match[1]);
  if (/(?:убер|удал|сократ|уменьш|короч|remove|shorter|reduce)/i.test(command)) return -amount;
  return /(?:добав|продл|увелич|длин|add|extend|longer)/i.test(command) ? amount : 0;
}

function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function updateRequest(request: PlannerRequest, plan: TripPlan, command: string, rates: CurrencyRates) {
  const budgetEdit = applyBudgetCommand(request, plan, command, rates);
  const budgetRequest = budgetEdit?.request ?? request;
  const delta = requestedDayDelta(command);
  const targetDays = plan.days.length + delta;
  if (targetDays < 1 || targetDays > 30) {
    return { error: 'После изменения поездка должна длиться от 1 до 30 дней.' } as const;
  }
  const routeEdits = [...(budgetRequest.routeEdits ?? []), command].slice(-10);
  if (!delta) return { value: { ...budgetRequest, routeEdits }, targetDays, budgetEdit } as const;

  const dates = budgetRequest.dates ? { ...budgetRequest.dates, end: shiftDate(budgetRequest.dates.end, delta) } : undefined;
  const confirmedSummary = budgetRequest.confirmedSummary ? {
    ...budgetRequest.confirmedSummary,
    dates: dates ?? budgetRequest.confirmedSummary.dates,
    durationDays: targetDays,
  } : undefined;
  return { value: { ...budgetRequest, dates, confirmedSummary, routeEdits }, targetDays, budgetEdit } as const;
}

function editPrompt(request: PlannerRequest, plan: TripPlan, command: string, targetDays: number, rates: CurrencyRates, budgetEdit?: BudgetEdit | null, retryReason = '') {
  const retry = retryReason ? `\nПредыдущая версия не прошла проверку: ${retryReason}. Исправь эту ошибку.` : '';
  return `${responseLanguageInstruction(request)}
Отредактируй существующий план поездки по короткой команде пользователя.
Команда с наивысшим приоритетом: ${command}
Контекст подтверждённой поездки: ${JSON.stringify(request)}
Текущий план — основной источник для всего, что пользователь не просил менять: ${JSON.stringify(plan)}
После изменения в days должно быть ровно ${targetDays} дней.
Бюджетная политика: ${budgetPromptGuidance(assessBudget(request, rates))}
${budgetEdit ? `Жёсткая цель обновлённого бюджета: не более ${budgetEdit.description}.` : ''}

Верни полный результат в ТОЧНО той же JSON-структуре, что при первоначальной генерации.
- Внеси изменение внутрь существующего маршрута, не добавляй пояснение поверх старого плана.
- Всё, чего команда не касается, сохрани максимально близко к текущей версии: места, жильё, питание, транспорт, бюджет и подготовку не переписывай без причины.
- Если добавляется город или направление, перераспредели дни, добавь реальные переезды и обнови связанные transport, accommodations, activities, budget и checklist.
- Если удаляется тип мест, убери его из days, placeIdeas и обзорных activities, заменив подходящими вариантами только там, где иначе день станет пустым.
- Не упоминай удалённый тип мест как рекомендацию и не сохраняй его под другим названием.
- Если меняется насыщенность, фактически измени число активностей, длительность, свободные окна и pace, сохранив географическую связность.
- При изменении длительности даты и номера дней должны быть непрерывными; новые дни наполни осмысленно, а не копируй механически.
- Пересчитай бюджет только в затронутых категориях. Не отказывай в генерации, кроме действительно абсурдно низкого максимума.
- При снижении бюджета реально удешеви жильё, платные активности, питание или транспорт; запрещено просто уменьшать числа без изменения рекомендаций.
- Каждую budget.categories[].note начинай с [ТИПИЧНЫЕ ЦЕНЫ], если сумма рассчитана по обычной цене за ночь, проезд или вход, либо с [ГРУБАЯ ОЦЕНКА], если цена сильно зависит от сезона и недоступна без актуального предложения.
- ${RECOMMENDATION_SAFETY_GUIDANCE}
- Обязательно сохрани полные отдельные разделы transport, accommodations, food, activities, usefulLinks и checklist.
- В accommodations, food и activities сохрани ровно по 6 вариантов: по 2 с tier budget, comfortable и luxury. Уровни определяй относительно цен конкретного направления, а не по единым мировым суммам.
- Если запрос невозможно выполнить буквально, верни реалистичную адаптацию с realism.status adjusted и понятным предупреждением.${retry}`;
}

function averageNight(plan: TripPlan) {
  return plan.accommodations.reduce((sum, item) => sum + item.pricePerNight, 0) / Math.max(1, plan.accommodations.length);
}

function complianceIssue(before: TripPlan, after: TripPlan, command: string, budgetEdit?: BudgetEdit | null) {
  if (/(?:убер|удал|исключ|без)\S*\s+музе/i.test(command)) {
    const selectableContent = JSON.stringify({ days: after.days, placeIdeas: after.placeIdeas, activities: after.activities });
    if (/музе/i.test(selectableContent)) return 'В маршруте остались музеи, хотя пользователь попросил их убрать.';
  }
  if (/(?:менее\s+насыщ|расслаб|спокойн|сниз\S*\s+темп)/i.test(command)) {
    const beforeCount = before.days.reduce((total, day) => total + day.activities.length, 0);
    const afterCount = after.days.reduce((total, day) => total + day.activities.length, 0);
    if (afterCount >= beforeCount && beforeCount > before.days.length * 2) {
      return 'Команда снизить насыщенность не уменьшила фактическое число активностей.';
    }
  }
  if (budgetEdit) {
    if (after.budget.currency.toUpperCase() !== budgetEdit.currency || after.budget.total > budgetEdit.target) {
      return `Итоговый бюджет должен быть не выше ${budgetEdit.description}.`;
    }
    const categoriesTotal = after.budget.categories.reduce((sum, item) => sum + item.amount, 0);
    if (Math.abs(categoriesTotal - after.budget.total) > Math.max(100, after.budget.total * 0.08)) {
      return 'Сумма бюджетных категорий не совпадает с итоговым бюджетом.';
    }
    if (budgetEdit.target < before.budget.total * 0.98) {
      const beforePaid = before.days.flatMap((day) => day.activities).reduce((sum, item) => sum + item.estimatedCost, 0);
      const afterPaid = after.days.flatMap((day) => day.activities).reduce((sum, item) => sum + item.estimatedCost, 0);
      if (averageNight(after) >= averageNight(before) && afterPaid >= beforePaid
        && JSON.stringify(after.transport) === JSON.stringify(before.transport)) {
        return 'Цифры бюджета уменьшены без реального удешевления жилья, активностей или транспорта.';
      }
    }
  }
  return null;
}

export async function editExistingPlan(
  request: PlannerRequest,
  plan: TripPlan,
  command: string,
  rates: CurrencyRates,
): Promise<EditFailure | EditSuccess> {
  const updated = updateRequest(request, plan, command, rates);
  if ('error' in updated) return { ok: false, code: 'INVALID_EDIT', message: updated.error, status: 400 };
  const budget = assessBudget(updated.value, rates);
  if (budget.level === 'absurdly_low') {
    return { ok: false, code: 'BUDGET_TOO_LOW', message: 'После изменения верхняя граница бюджета стала нереалистично низкой для поездки.', status: 422 };
  }

  let lastError = '';
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const gemini = await requestGemini(editPrompt(updated.value, plan, command, updated.targetDays, rates, updated.budgetEdit, lastError), attempt ? 55_000 : 80_000, {
      temperature: 0.25,
      maxOutputTokens: 16_384,
    });
    if (!gemini.ok) {
      if (gemini.code === 'AI_TIMEOUT' && attempt === 0) { lastError = 'Первый ответ не успел завершиться; верни более компактный полный JSON.'; continue; }
      return gemini;
    }
    const parsed = parsePlannerAIResult(gemini.text, updated.value);
    if ('error' in parsed) { lastError = parsed.error; continue; }
    if (parsed.value.status === 'budget_too_low') {
      lastError = `Не отклоняй бюджет до ${budget.maximumLabel}; верни полный обновлённый план.`;
      continue;
    }
    const compliance = complianceIssue(plan, parsed.value.plan, command, updated.budgetEdit);
    if (compliance) { lastError = compliance; continue; }
    return { ok: true, request: updated.value, plan: applyBudgetWarning(parsed.value.plan, budget, updated.value.responseLanguage) };
  }
  const realism = lastError.replace('Plan realism check failed: ', '');
  return {
    ok: false,
    code: lastError.startsWith('Plan realism check failed:') ? 'UNREALISTIC_AI_PLAN' : 'INVALID_AI_RESPONSE',
    message: lastError.startsWith('Plan realism check failed:')
      ? `${localizedPlannerText(request, 'ИИ не смог согласовать изменение с реальным расписанием.', 'AI could not reconcile this change with a realistic schedule.')} ${realism}`
      : localizedPlannerText(request, 'ИИ дважды вернул неполный обновлённый план. Попробуйте сформулировать изменение немного точнее.', 'AI returned an incomplete updated itinerary twice. Try phrasing the change a little more precisely.'),
    status: 502,
  };
}
