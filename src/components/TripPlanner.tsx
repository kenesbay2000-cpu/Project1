import { FormEvent, useMemo, useState } from 'react';

const dailyRates: Record<string, number> = {
  'Стамбул, Турция': 42000,
  'Тбилиси, Грузия': 36000,
  'Бали, Индонезия': 52000,
  'Токио, Япония': 62000,
  'Сингапур, Сингапур': 65000,
  'Гонконг, Китай': 58000,
  'Рим, Италия': 61000,
  'Нячанг, Вьетнам': 44000,
  'Алматы, Казахстан': 28000,
};

const formatMoney = (value: number) => new Intl.NumberFormat('ru-RU').format(value);

export function TripPlanner() {
  const [destination, setDestination] = useState('Стамбул, Турция');
  const [days, setDays] = useState(7);
  const [nights, setNights] = useState(6);
  const [travelers, setTravelers] = useState(2);
  const [showEstimate, setShowEstimate] = useState(false);

  const estimate = useMemo(() => {
    const daily = dailyRates[destination] ?? 45000;
    return daily * Math.max(days, nights) * travelers + 180000 * travelers;
  }, [destination, days, nights, travelers]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setShowEstimate(true);
  };

  return (
    <form className="planner" id="planner" onSubmit={submit}>
      <div className="planner__field">
        <span className="planner__icon">⌖</span>
        <div>
          <label htmlFor="destination">Куда хотите?</label>
          <input id="destination" list="places" value={destination} onChange={(event) => setDestination(event.target.value)} />
          <datalist id="places">{Object.keys(dailyRates).map((place) => <option key={place} value={place} />)}</datalist>
        </div>
      </div>
      <div className="planner__field">
        <span className="planner__icon">◫</span>
        <div>
          <label>Дней / ночей</label>
          <div className="planner__number">
            <input aria-label="Количество дней" min="1" max="60" type="number" value={days} onChange={(event) => setDays(Number(event.target.value))} />
            <input aria-label="Количество ночей" min="0" max="59" type="number" value={nights} onChange={(event) => setNights(Number(event.target.value))} />
          </div>
        </div>
      </div>
      <div className="planner__field">
        <span className="planner__icon">♙</span>
        <div>
          <label htmlFor="travelers">Путешественники</label>
          <select id="travelers" value={travelers} onChange={(event) => setTravelers(Number(event.target.value))}>
            {[1, 2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{count} чел.</option>)}
          </select>
        </div>
      </div>
      <div className="planner__field">
        <span className="planner__icon">◉</span>
        <div><label>Стиль поездки</label><select><option>Комфорт</option><option>Экономно</option><option>Премиум</option></select></div>
      </div>
      <button className="planner__submit" type="submit">Создать план →</button>
      {showEstimate && <div className="estimate">Примерный бюджет поездки<strong>≈ {formatMoney(estimate)} ₸</strong></div>}
    </form>
  );
}
