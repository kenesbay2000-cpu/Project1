import { type FormEvent, useEffect, useState } from 'react';
import type { PlannerRequest } from '../lib/aiPlanner';
import { PlannerPreferenceChoice } from './PlannerPreferenceChoice';
import { applyPreferenceSelection } from '../lib/preferenceSelection';
import './PlannerInitialForm.css';

type Props = {
  preferences: string[];
  defaultUsePreferences: boolean;
  onContinue: (request: PlannerRequest, usePreferences?: boolean) => Promise<void>;
};

const promptExamples = [
  'Хочу неделю в Японии: природа, небольшие кафе и спокойный темп…',
  'Море в феврале для двоих, красивый отель и минимум туристических мест…',
  'Соберите семейное путешествие по Италии с детьми и без спешки…',
  'Мечтаю увидеть северное сияние и пожить пару ночей в уютном домике…',
];

const budgetSettings = {
  KZT: { min: 300_000, max: 1_200_000, limit: 5_000_000, step: 50_000 },
  USD: { min: 1_000, max: 4_000, limit: 30_000, step: 100 },
  EUR: { min: 1_000, max: 4_000, limit: 30_000, step: 100 },
};

function parseAges(value: string) {
  if (!value.trim()) return undefined;
  const ages = value.split(',').map((age) => Number(age.trim()));
  if (ages.some((age) => !Number.isInteger(age) || age < 0 || age > 120)) throw new Error('Укажите возраст целыми числами от 0 до 120 через запятую.');
  return ages;
}

export function PlannerInitialForm({ preferences, defaultUsePreferences, onContinue }: Props) {
  const [prompt, setPrompt] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [originCity, setOriginCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelers, setTravelers] = useState('');
  const [ages, setAges] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [currency, setCurrency] = useState<keyof typeof budgetSettings>('KZT');
  const [error, setError] = useState('');
  const [usePreferences, setUsePreferences] = useState(defaultUsePreferences);
  const [isStarting, setIsStarting] = useState(false);
  const budget = budgetSettings[currency];
  const shownMin = Number(minPrice || budget.min);
  const shownMax = Number(maxPrice || budget.max);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => setPlaceholderIndex((current) => (current + 1) % promptExamples.length), 4_200);
    return () => window.clearInterval(timer);
  }, []);

  const changeTravelers = (step: number) => {
    const current = travelers ? Number(travelers) : step > 0 ? 0 : 2;
    setTravelers(String(Math.min(20, Math.max(1, current + step))));
  };

  const changeCurrency = (nextCurrency: keyof typeof budgetSettings) => {
    setCurrency(nextCurrency);
    setMinPrice('');
    setMaxPrice('');
  };

  const changeBudgetMin = (value: number) => {
    setMinPrice(String(Math.min(value, shownMax)));
    if (!maxPrice) setMaxPrice(String(budget.max));
  };

  const changeBudgetMax = (value: number) => {
    setMaxPrice(String(Math.max(value, shownMin)));
    if (!minPrice) setMinPrice(String(budget.min));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    try {
      let request: PlannerRequest = { prompt: prompt.trim() };
      if (originCity.trim()) request.originCity = originCity.trim();
      if (startDate || endDate) {
        if (!startDate || !endDate) throw new Error('Укажите обе даты поездки или оставьте обе пустыми.');
        if (endDate < startDate) throw new Error('Дата окончания раньше даты начала. Исправьте даты.');
        request.dates = { start: startDate, end: endDate };
      }
      if (travelers) request.travelers = Number(travelers);
      const travelerAges = parseAges(ages);
      if (travelerAges) {
        if (request.travelers && travelerAges.length > request.travelers) throw new Error('Возрастов не может быть больше, чем путешественников.');
        request.travelerAges = travelerAges;
      }
      if (minPrice || maxPrice) {
        if (!minPrice || !maxPrice) throw new Error('Укажите обе границы бюджета или оставьте их пустыми.');
        const min = Number(minPrice);
        const max = Number(maxPrice);
        if (min < 0 || max < min) throw new Error('Проверьте минимальную и максимальную сумму бюджета.');
        request.priceRange = { min, max, currency };
      }
      request = applyPreferenceSelection(request, preferences, usePreferences);
      setIsStarting(true);
      await onContinue(request, preferences.length ? usePreferences : undefined);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Проверьте исходные данные.');
    } finally { setIsStarting(false); }
  };

  return (
    <form className="planner-form" onSubmit={submit}>
      <section className="planner-form__section planner-form__section--prompt">
        <header><span aria-hidden="true">✦</span><div><small>Начните с мечты</small><h2>Какой должна быть поездка?</h2></div></header>
        <label className={`planner-prompt${prompt ? ' is-filled' : ''}`}>
          <textarea aria-label="Опишите поездку" required maxLength={4000} rows={6} value={prompt} onChange={(event) => setPrompt(event.target.value)} />
          {!prompt && <span className="planner-prompt__example" key={placeholderIndex}>{promptExamples[placeholderIndex]}</span>}
          <small>{prompt.length.toLocaleString('ru-RU')} / 4 000</small>
        </label>
      </section>

      {preferences.length > 0 && <PlannerPreferenceChoice preferences={preferences} usePreferences={usePreferences} onChange={setUsePreferences} />}

      <section className="planner-form__section">
        <header><span aria-hidden="true">⌖</span><div><small>01 · Маршрут</small><h2>Когда и откуда</h2></div></header>
        <div className="planner-form__grid planner-form__grid--route">
          <label className={`planner-control${originCity ? ' is-filled' : ''}`}><span>Город вылета</span><input value={originCity} maxLength={120} onChange={(event) => setOriginCity(event.target.value)} placeholder="Например, Алматы" /></label>
          <label className={`planner-control${startDate ? ' is-filled' : ''}`}><span>Начало</span><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
          <label className={`planner-control${endDate ? ' is-filled' : ''}`}><span>Возвращение</span><input type="date" min={startDate || undefined} value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
        </div>
      </section>

      <section className="planner-form__section">
        <header><span aria-hidden="true">◎</span><div><small>02 · Компания</small><h2>Кто едет</h2></div></header>
        <div className="planner-form__grid planner-form__grid--people">
          <div className={`planner-control planner-travelers${travelers ? ' is-filled' : ''}`}><span>Путешественники</span><div><button type="button" onClick={() => changeTravelers(-1)} aria-label="Уменьшить количество">−</button><input aria-label="Количество путешественников" type="number" min="1" max="20" value={travelers} onChange={(event) => setTravelers(event.target.value)} placeholder="—" /><button type="button" onClick={() => changeTravelers(1)} aria-label="Увеличить количество">+</button></div></div>
          <label className={`planner-control${ages ? ' is-filled' : ''}`}><span>Возраст, если это важно</span><input value={ages} onChange={(event) => setAges(event.target.value)} placeholder="Например, 34, 12" /><small>Через запятую</small></label>
        </div>
      </section>

      <section className="planner-form__section planner-form__section--budget">
        <header><span aria-hidden="true">₸</span><div><small>03 · Возможности</small><h2>Бюджет поездки</h2></div></header>
        <div className="planner-budget">
          <div className="planner-budget__heading"><p>{minPrice && maxPrice ? <><strong>{shownMin.toLocaleString('ru-RU')}–{shownMax.toLocaleString('ru-RU')}</strong> {currency}</> : 'Можно пропустить — AI предложит реалистичный диапазон'}</p><select aria-label="Валюта" value={currency} onChange={(event) => changeCurrency(event.target.value as keyof typeof budgetSettings)}><option value="KZT">KZT</option><option value="USD">USD</option><option value="EUR">EUR</option></select></div>
          <label><span>Минимум <output>{shownMin.toLocaleString('ru-RU')} {currency}</output></span><input type="range" min="0" max={budget.limit} step={budget.step} value={shownMin} onChange={(event) => changeBudgetMin(Number(event.target.value))} /></label>
          <label><span>Максимум <output>{shownMax.toLocaleString('ru-RU')} {currency}</output></span><input type="range" min="0" max={budget.limit} step={budget.step} value={shownMax} onChange={(event) => changeBudgetMax(Number(event.target.value))} /></label>
          {(minPrice || maxPrice) && <button className="planner-budget__reset" type="button" onClick={() => { setMinPrice(''); setMaxPrice(''); }}>Не указывать бюджет</button>}
        </div>
      </section>

      {error && <div className="planner-form__error" role="alert">{error}</div>}
      <footer className="planner-form__footer"><button className="planner-form__submit" type="submit" disabled={isStarting}>{isStarting ? 'Сохраняем выбор…' : 'Продолжить с AI'} <span>→</span></button><p>AI задаст только важные уточнения и покажет сводку перед генерацией.</p></footer>
    </form>
  );
}
