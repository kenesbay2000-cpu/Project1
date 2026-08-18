import { type FormEvent, useState } from 'react';
import type { PlannerRequest } from '../lib/aiPlanner';

type Props = { onContinue: (request: PlannerRequest) => void };
function parseAges(value: string) {
  if (!value.trim()) return undefined;
  const ages = value.split(',').map((age) => Number(age.trim()));
  if (ages.some((age) => !Number.isInteger(age) || age < 0 || age > 120)) throw new Error('Укажите возраст целыми числами от 0 до 120 через запятую.');
  return ages;
}

export function PlannerInitialForm({ onContinue }: Props) {
  const [prompt, setPrompt] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelers, setTravelers] = useState('');
  const [ages, setAges] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [currency, setCurrency] = useState('KZT');
  const [error, setError] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    try {
      const request: PlannerRequest = { prompt: prompt.trim() };
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
      onContinue(request);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Проверьте исходные данные.');
    }
  };

  return (
    <form className="planner-form" onSubmit={submit}>
      <label className="planner-form__wide">Опишите поездку<textarea required maxLength={4000} rows={5} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Например: хочу неделю в Японии, люблю природу, небольшие кафе и спокойный темп" /></label>
      <label>Город вылета<input value={originCity} maxLength={120} onChange={(event) => setOriginCity(event.target.value)} placeholder="Например, Алматы" /></label>
      <label>Дата начала<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
      <label>Дата окончания<input type="date" min={startDate || undefined} value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
      <label>Путешественники<input type="number" min="1" max="20" value={travelers} onChange={(event) => setTravelers(event.target.value)} placeholder="Например, 2" /></label>
      <label>Возраст через запятую<input value={ages} onChange={(event) => setAges(event.target.value)} placeholder="Например, 34, 12" /></label>
      <label>Бюджет от<input type="number" min="0" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="200000" /></label>
      <label>Бюджет до<input type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="500000" /></label>
      <label>Валюта<select value={currency} onChange={(event) => setCurrency(event.target.value)}><option value="KZT">KZT</option><option value="USD">USD</option><option value="EUR">EUR</option></select></label>
      {error && <div className="planner-form__error" role="alert">{error}</div>}
      <button className="planner-form__submit" type="submit">Продолжить с AI</button>
      <p className="planner-form__loading">AI задаст только важные уточнения, а перед генерацией покажет сводку для подтверждения.</p>
    </form>
  );
}
