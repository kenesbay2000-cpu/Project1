import { type FormEvent, useEffect, useState } from 'react';
import type { PlannerRequest } from '../lib/aiPlanner';
import { PlannerPreferenceChoice } from './PlannerPreferenceChoice';
import { applyPreferenceSelection } from '../lib/preferenceSelection';
import './PlannerInitialForm.css';
import { useI18n } from '../i18n/I18nProvider';
import { budgetSettings, currencyName, supportedCurrencies, type CurrencyCode } from '../lib/currencies';

type Props = {
  preferences: string[];
  defaultUsePreferences: boolean;
  onContinue: (request: PlannerRequest, usePreferences?: boolean) => Promise<void>;
};

function parseAges(value: string, errorMessage: string) {
  if (!value.trim()) return undefined;
  const ages = value.split(',').map((age) => Number(age.trim()));
  if (ages.some((age) => !Number.isInteger(age) || age < 0 || age > 120)) throw new Error(errorMessage);
  return ages;
}

export function PlannerInitialForm({ preferences, defaultUsePreferences, onContinue }: Props) {
  const { t, language } = useI18n();
  const translatedExamples = [t('planner.example1'), t('planner.example2'), t('planner.example3'), t('planner.example4')];
  const locale = language === 'ru' ? 'ru-RU' : 'en-US';
  const [prompt, setPrompt] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [originCity, setOriginCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelers, setTravelers] = useState('');
  const [ages, setAges] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('KZT');
  const [error, setError] = useState('');
  const [usePreferences, setUsePreferences] = useState(defaultUsePreferences);
  const [isStarting, setIsStarting] = useState(false);
  const budget = budgetSettings[currency];
  const shownMin = Number(minPrice || budget.min);
  const shownMax = Number(maxPrice || budget.max);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => setPlaceholderIndex((current) => (current + 1) % translatedExamples.length), 4_200);
    return () => window.clearInterval(timer);
  }, []);

  const changeTravelers = (step: number) => {
    const current = travelers ? Number(travelers) : step > 0 ? 0 : 2;
    setTravelers(String(Math.min(20, Math.max(1, current + step))));
  };

  const changeCurrency = (nextCurrency: CurrencyCode) => {
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
      let request: PlannerRequest = { prompt: prompt.trim(), responseLanguage: language };
      if (originCity.trim()) request.originCity = originCity.trim();
      if (startDate || endDate) {
        if (!startDate || !endDate) throw new Error(t('planner.errorDatesBoth'));
        if (endDate < startDate) throw new Error(t('planner.errorDatesOrder'));
        request.dates = { start: startDate, end: endDate };
      }
      if (travelers) request.travelers = Number(travelers);
      const travelerAges = parseAges(ages, t('planner.errorAges'));
      if (travelerAges) {
        if (request.travelers && travelerAges.length > request.travelers) throw new Error(t('planner.errorAgeCount'));
        request.travelerAges = travelerAges;
      }
      if (minPrice || maxPrice) {
        if (!minPrice || !maxPrice) throw new Error(t('planner.errorBudgetBoth'));
        const min = Number(minPrice);
        const max = Number(maxPrice);
        if (min < 0 || max < min) throw new Error(t('planner.errorBudgetRange'));
        request.priceRange = { min, max, currency };
      }
      request = applyPreferenceSelection(request, preferences, usePreferences);
      setIsStarting(true);
      await onContinue(request, preferences.length ? usePreferences : undefined);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t('planner.errorCheckData'));
    } finally { setIsStarting(false); }
  };

  return (
    <form className="planner-form" onSubmit={submit}>
      <section className="planner-form__section planner-form__section--prompt">
        <header><span aria-hidden="true">✦</span><div><small>{t('planner.dreamEyebrow')}</small><h2>{t('planner.dreamTitle')}</h2></div></header>
        <label className={`planner-prompt${prompt ? ' is-filled' : ''}`}>
          <textarea aria-label={t('planner.describeAria')} required maxLength={4000} rows={6} value={prompt} onChange={(event) => setPrompt(event.target.value)} />
          {!prompt && <span className="planner-prompt__example" key={placeholderIndex}>{translatedExamples[placeholderIndex]}</span>}
          <small>{prompt.length.toLocaleString(locale)} / 4 000</small>
        </label>
      </section>

      {preferences.length > 0 && <PlannerPreferenceChoice preferences={preferences} usePreferences={usePreferences} onChange={setUsePreferences} />}

      <section className="planner-form__section">
        <header><span aria-hidden="true">⌖</span><div><small>{t('planner.routeEyebrow')}</small><h2>{t('planner.whenFrom')}</h2></div></header>
        <div className="planner-form__grid planner-form__grid--route">
          <label className={`planner-control${originCity ? ' is-filled' : ''}`}><span>{t('planner.origin')}</span><input value={originCity} maxLength={120} onChange={(event) => setOriginCity(event.target.value)} placeholder={t('planner.originPlaceholder')} /></label>
          <label className={`planner-control${startDate ? ' is-filled' : ''}`}><span>{t('planner.start')}</span><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
          <label className={`planner-control${endDate ? ' is-filled' : ''}`}><span>{t('planner.return')}</span><input type="date" min={startDate || undefined} value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
        </div>
      </section>

      <section className="planner-form__section">
        <header><span aria-hidden="true">◎</span><div><small>{t('planner.companyEyebrow')}</small><h2>{t('planner.who')}</h2></div></header>
        <div className="planner-form__grid planner-form__grid--people">
          <div className={`planner-control planner-travelers${travelers ? ' is-filled' : ''}`}><span>{t('planner.travelers')}</span><div><button type="button" onClick={() => changeTravelers(-1)} aria-label={t('planner.decrease')}>−</button><input aria-label={t('planner.travelerCount')} type="number" min="1" max="20" value={travelers} onChange={(event) => setTravelers(event.target.value)} placeholder="—" /><button type="button" onClick={() => changeTravelers(1)} aria-label={t('planner.increase')}>+</button></div></div>
          <label className={`planner-control${ages ? ' is-filled' : ''}`}><span>{t('planner.ages')}</span><input value={ages} onChange={(event) => setAges(event.target.value)} placeholder={t('planner.agesPlaceholder')} /><small>{t('planner.commaSeparated')}</small></label>
        </div>
      </section>

      <section className="planner-form__section planner-form__section--budget">
        <header><span aria-hidden="true">₸</span><div><small>{t('planner.meansEyebrow')}</small><h2>{t('planner.tripBudget')}</h2></div></header>
        <div className="planner-budget">
          <div className="planner-budget__heading"><p>{minPrice && maxPrice ? <><strong>{shownMin.toLocaleString(locale)}–{shownMax.toLocaleString(locale)}</strong> {currency}</> : t('planner.budgetSkip')}</p><select aria-label={t('planner.currency')} value={currency} onChange={(event) => changeCurrency(event.target.value as CurrencyCode)}>{supportedCurrencies.map((code) => <option value={code} key={code}>{code} · {currencyName(code, language)}</option>)}</select></div>
          <label><span>{t('planner.minimum')} <output>{shownMin.toLocaleString(locale)} {currency}</output></span><input type="range" min="0" max={budget.limit} step={budget.step} value={shownMin} onChange={(event) => changeBudgetMin(Number(event.target.value))} /></label>
          <label><span>{t('planner.maximum')} <output>{shownMax.toLocaleString(locale)} {currency}</output></span><input type="range" min="0" max={budget.limit} step={budget.step} value={shownMax} onChange={(event) => changeBudgetMax(Number(event.target.value))} /></label>
          {(minPrice || maxPrice) && <button className="planner-budget__reset" type="button" onClick={() => { setMinPrice(''); setMaxPrice(''); }}>{t('planner.noBudget')}</button>}
        </div>
      </section>

      {error && <div className="planner-form__error" role="alert">{error}</div>}
      <footer className="planner-form__footer"><button className="planner-form__submit" type="submit" disabled={isStarting}>{isStarting ? t('planner.savingChoice') : t('planner.continueAI')} <span>→</span></button><p>{t('planner.formFooter')}</p></footer>
    </form>
  );
}
