import { FormEvent, useState } from 'react';
import { useLocation } from 'wouter';
import { useI18n } from '../i18n/I18nProvider';

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

export function TripPlanner() {
  const { t } = useI18n();
  const [, navigate] = useLocation();
  const [destination, setDestination] = useState('Стамбул, Турция');
  const [days, setDays] = useState(7);
  const [nights, setNights] = useState(6);
  const [travelers, setTravelers] = useState(2);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    navigate('/planner');
  };

  return (
    <form className="planner" id="planner" onSubmit={submit}>
      <div className="planner__field">
        <span className="planner__icon">⌖</span>
        <div>
          <label htmlFor="destination">{t('quick.destination')}</label>
          <input id="destination" list="places" value={destination} onChange={(event) => setDestination(event.target.value)} />
          <datalist id="places">{Object.keys(dailyRates).map((place) => <option key={place} value={place} />)}</datalist>
        </div>
      </div>
      <div className="planner__field">
        <span className="planner__icon">◫</span>
        <div>
          <label>{t('quick.daysNights')}</label>
          <div className="planner__number">
            <input aria-label={t('quick.days')} min="1" max="60" type="number" value={days} onChange={(event) => setDays(Number(event.target.value))} />
            <input aria-label={t('quick.nights')} min="0" max="59" type="number" value={nights} onChange={(event) => setNights(Number(event.target.value))} />
          </div>
        </div>
      </div>
      <div className="planner__field">
        <span className="planner__icon">♙</span>
        <div>
          <label htmlFor="travelers">{t('quick.travelers')}</label>
          <select id="travelers" value={travelers} onChange={(event) => setTravelers(Number(event.target.value))}>
            {[1, 2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{t('quick.people', { count })}</option>)}
          </select>
        </div>
      </div>
      <div className="planner__field">
        <span className="planner__icon">◉</span>
        <div><label>{t('quick.style')}</label><select><option>{t('quick.comfort')}</option><option>{t('quick.economy')}</option><option>{t('quick.premium')}</option></select></div>
      </div>
      <button className="planner__submit" type="submit">{t('quick.submit')}</button>
    </form>
  );
}
