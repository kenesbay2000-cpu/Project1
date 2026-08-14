import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { Link } from 'wouter';
import { loadTravelSurveyResponse, loadTravelVoteStats, saveTravelSurveyResponse, type TravelVoteStats } from '../lib/travelSurvey';
import { searchCities, type CityOption } from '../lib/citySearch';
import { destinations } from '../lib/destinations';
import { useAuth } from './AuthProvider';
import { CityAutocomplete } from './CityAutocomplete';
import './DestinationVote.css';

export function DestinationVote() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [city, setCity] = useState<CityOption | null>(null);
  const [savedCity, setSavedCity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [stats, setStats] = useState<TravelVoteStats | null>(null);
  const [statsError, setStatsError] = useState(false);

  async function refreshStats() {
    try { setStats(await loadTravelVoteStats()); setStatsError(false); }
    catch { setStatsError(true); }
  }

  useEffect(() => { void refreshStats(); }, []);

  useEffect(() => {
    if (!user) { setSavedCity(''); setCity(null); return; }
    let isActive = true;
    setIsLoading(true); setError(''); setSavedCity(''); setCity(null);
    loadTravelSurveyResponse()
      .then(async (response) => {
        if (!response) return;
        if (isActive) setSavedCity(response.destinationCity);
        const options = await searchCities(response.destinationCity);
        const normalizedName = response.destinationCity.toLocaleLowerCase('ru');
        const savedOption = options.find((option) => option.name.toLocaleLowerCase('ru') === normalizedName);
        if (isActive && savedOption) setCity(savedOption);
      })
      .catch(() => { if (isActive) setError('Не удалось загрузить ваш голос.'); })
      .finally(() => { if (isActive) setIsLoading(false); });
    return () => { isActive = false; };
  }, [user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!city) { event.currentTarget.reportValidity(); return; }
    setIsSaving(true); setError(''); setSuccess(false);
    try {
      const response = await saveTravelSurveyResponse(city.name);
      setSavedCity(response.destinationCity); setSuccess(true);
      await refreshStats();
    } catch {
      setError('Не удалось сохранить голос. Проверьте интернет и попробуйте снова.');
    } finally {
      setIsSaving(false);
    }
  }

  const leader = stats?.leadingDestination ?? '';
  const catalogLeader = destinations.find((destination) => destination.city.localeCompare(leader, 'ru', { sensitivity: 'base' }) === 0);
  const backgroundStyle = catalogLeader ? { '--vote-photo': `url(${catalogLeader.image})` } as CSSProperties : undefined;

  return (
    <section className={`destination-vote${catalogLeader ? ' has-leader-photo' : ''}`} style={backgroundStyle} aria-labelledby="destination-vote-title">
      <div className="destination-vote__copy">
        <span className="section-label">Выбор путешественников</span>
        <h2 id="destination-vote-title">{leader || 'Куда вы мечтаете поехать?'}</h2>
        <p>{leader
          ? catalogLeader?.description ?? 'Сейчас это самое желанное направление среди наших путешественников.'
          : 'Выберите настоящий город из подсказок. Один аккаунт — один актуальный голос.'}</p>
        <div className="destination-vote__stats" aria-live="polite">
          <span><strong>{stats?.totalVotes ?? '—'}</strong> всего голосов</span>
        </div>
        {stats && stats.topDestinations.length > 0 && (
          <div className="destination-vote__top">
            <span>Топ-4 направления</span>
            <ol>
              {stats.topDestinations.map((item) => (
                <li key={item.destination}>
                  <span>{item.destination}</span><strong>{item.votes}</strong>
                </li>
              ))}
            </ol>
          </div>
        )}
        {statsError && <small className="destination-vote__stats-error">Статистика временно недоступна</small>}
      </div>
      <div className="destination-vote__card">
        {isAuthLoading ? <p className="destination-vote__status">Проверяем аккаунт…</p> : !user ? (
          <div className="destination-vote__login">
            <p>Войдите в аккаунт, чтобы проголосовать.</p>
            <div className="destination-vote__actions">
              <Link href="/login">Войти <span>→</span></Link>
              <Link className="is-secondary" href="/signup">Регистрация</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {savedCity && <p className="destination-vote__current">Ваш текущий выбор: <strong>{savedCity}</strong></p>}
            <CityAutocomplete label="Куда бы вы хотели поехать?" name="destination-city" value={city}
              onChange={(nextCity) => { setCity(nextCity); setError(''); setSuccess(false); }} required disabled={isSaving || isLoading} />
            {error && <p className="destination-vote__error" role="alert">{error}</p>}
            {success && <p className="destination-vote__success" role="status">Голос сохранён!</p>}
            <button type="submit" disabled={!city || isSaving || isLoading}>
              {isSaving ? 'Сохраняем…' : savedCity ? 'Изменить голос' : 'Проголосовать'} <span>→</span>
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
