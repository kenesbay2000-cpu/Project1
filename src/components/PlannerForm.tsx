import { FormEvent, useState } from 'react';
import { generateTripPlan, type PlannerRequest, type TripPlan } from '../lib/aiPlanner';

type PlannerFormProps = {
  onPlanCreated: (plan: TripPlan) => void;
};

function parseAges(value: string) {
  if (!value.trim()) return undefined;
  const ages = value.split(',').map((age) => Number(age.trim()));
  if (ages.some((age) => !Number.isInteger(age) || age < 0 || age > 120)) {
    throw new Error('Укажите возраст целыми числами от 0 до 120 через запятую.');
  }
  return ages;
}

export function PlannerForm({ onPlanCreated }: PlannerFormProps) {
  const [prompt, setPrompt] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelers, setTravelers] = useState('');
  const [ages, setAges] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [currency, setCurrency] = useState('KZT');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const buildRequest = (): PlannerRequest => {
    const request: PlannerRequest = { prompt: prompt.trim() };
    if (startDate || endDate) {
      if (!startDate || !endDate) throw new Error('Укажите обе даты поездки или оставьте обе пустыми.');
      if (endDate < startDate) throw new Error('Дата окончания раньше даты начала. Исправьте даты и повторите запрос.');
      request.dates = { start: startDate, end: endDate };
    }
    if (travelers) request.travelers = Number(travelers);

    const travelerAges = parseAges(ages);
    if (travelerAges) {
      if (request.travelers && travelerAges.length > request.travelers) {
        throw new Error('Возрастов не может быть больше, чем путешественников.');
      }
      request.travelerAges = travelerAges;
    }

    if (minPrice || maxPrice) {
      if (!minPrice || !maxPrice) throw new Error('Укажите обе границы бюджета или оставьте их пустыми.');
      const min = Number(minPrice);
      const max = Number(maxPrice);
      if (min < 0 || max < min) throw new Error('Проверьте минимальную и максимальную сумму бюджета.');
      request.priceRange = { min, max, currency };
    }
    return request;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      onPlanCreated(await generateTripPlan(buildRequest()));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Не удалось создать маршрут. Попробуйте ещё раз.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="planner-form" onSubmit={submit}>
      <label className="planner-form__wide">Опишите поездку
        <textarea required maxLength={4000} rows={5} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Например: хочу неделю в Японии, люблю природу, небольшие кафе и спокойный темп" />
      </label>
      <label>Дата начала<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
      <label>Дата окончания<input type="date" min={startDate || undefined} value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
      <label>Путешественники<input type="number" min="1" max="20" value={travelers} onChange={(event) => setTravelers(event.target.value)} placeholder="Например, 2" /></label>
      <label>Возраст через запятую<input value={ages} onChange={(event) => setAges(event.target.value)} placeholder="Например, 34, 12" /></label>
      <label>Бюджет от<input type="number" min="0" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="200000" /></label>
      <label>Бюджет до<input type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="500000" /></label>
      <label>Валюта<select value={currency} onChange={(event) => setCurrency(event.target.value)}><option value="KZT">KZT</option><option value="USD">USD</option><option value="EUR">EUR</option></select></label>

      {error && <div className="planner-form__error" role="alert">{error}</div>}
      <button className="planner-form__submit" disabled={isLoading} type="submit">
        {isLoading ? 'Создаём маршрут…' : error ? 'Попробовать снова' : 'Создать маршрут'}
      </button>
      {isLoading && <p className="planner-form__loading" role="status">Gemini подбирает места и собирает план. Это может занять несколько секунд.</p>}
    </form>
  );
}
