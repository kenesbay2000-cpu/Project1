import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { formatCityOption, searchCities, type CityOption } from '../lib/citySearch';
import './CityAutocomplete.css';

type CityAutocompleteProps = {
  label: string;
  value: CityOption | null;
  onChange: (city: CityOption | null) => void;
  name?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
};

export function CityAutocomplete({
  label, value, onChange, name, placeholder = 'Начните вводить город', required = false, disabled = false,
}: CityAutocompleteProps) {
  const inputId = useId();
  const listId = `${inputId}-listbox`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(value ? formatCityOption(value) : '');
  const [options, setOptions] = useState<CityOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (value) setQuery(formatCityOption(value));
  }, [value]);

  useEffect(() => {
    if (value || query.trim().length < 2) {
      setOptions([]); setIsLoading(false); setIsOpen(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true); setError('');
      try {
        const cities = await searchCities(query, controller.signal);
        setOptions(cities); setIsOpen(true); setActiveIndex(-1);
      } catch (searchError) {
        if ((searchError as Error).name !== 'AbortError') setError('Не удалось найти города. Попробуйте ещё раз.');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 350);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, value]);

  function selectCity(city: CityOption) {
    onChange(city); setQuery(formatCityOption(city)); setIsOpen(false); setError('');
    inputRef.current?.setCustomValidity('');
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || options.length === 0) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex((index) => (index + 1) % options.length); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((index) => (index <= 0 ? options.length - 1 : index - 1)); }
    if (event.key === 'Enter' && activeIndex >= 0) { event.preventDefault(); selectCity(options[activeIndex]); }
    if (event.key === 'Escape') setIsOpen(false);
  }

  const validationMessage = query.trim() && !value ? 'Выберите город из списка подсказок.' : '';

  return (
    <label className="city-autocomplete" htmlFor={inputId}>
      <span>{label}</span>
      <div className="city-autocomplete__control">
        <input ref={inputRef} id={inputId} name={name} value={query} placeholder={placeholder}
          autoComplete="off" disabled={disabled} required={required} role="combobox"
          aria-autocomplete="list" aria-expanded={isOpen} aria-controls={listId}
          aria-invalid={Boolean(error || validationMessage)}
          aria-activedescendant={activeIndex >= 0 ? `${inputId}-option-${activeIndex}` : undefined}
          onChange={(event) => { setQuery(event.target.value); onChange(null); setError(''); event.target.setCustomValidity('Выберите город из списка подсказок.'); }}
          onFocus={() => options.length > 0 && setIsOpen(true)} onKeyDown={handleKeyDown}
          onBlur={(event) => { event.currentTarget.setCustomValidity(validationMessage); window.setTimeout(() => setIsOpen(false), 150); }} />
        {isLoading && <span className="city-autocomplete__spinner" aria-label="Ищем города" />}
        {isOpen && (
          <ul id={listId} className="city-autocomplete__options" role="listbox">
            {options.map((city, index) => (
              <li id={`${inputId}-option-${index}`} key={city.id} role="option" aria-selected={activeIndex === index}
                className={activeIndex === index ? 'is-active' : ''} onMouseDown={() => selectCity(city)}>
                <strong>{city.name}</strong><small>{[city.region, city.country].filter(Boolean).join(', ')}</small>
              </li>
            ))}
            {!isLoading && options.length === 0 && <li className="city-autocomplete__empty" role="option" aria-disabled="true">Города не найдены</li>}
          </ul>
        )}
      </div>
      {(error || validationMessage) && <small className="city-autocomplete__message">{error || validationMessage}</small>}
    </label>
  );
}
