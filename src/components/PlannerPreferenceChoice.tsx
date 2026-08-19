type Props = {
  preferences: string[];
  usePreferences: boolean;
  onChange: (value: boolean) => void;
};

export function PlannerPreferenceChoice({ preferences, usePreferences, onChange }: Props) {
  return (
    <section className="planner-form__section planner-form__section--memory" aria-labelledby="planner-memory-title">
      <header><span aria-hidden="true">◇</span><div><small>Память AI</small><h2 id="planner-memory-title">Использовать ваши сохранённые предпочтения из прошлых поездок?</h2></div></header>
      <div className="planner-memory__preferences">
        {preferences.map((preference) => <span key={preference}>{preference}</span>)}
      </div>
      <div className="planner-memory__choice" role="radiogroup" aria-label="Использовать сохранённые предпочтения">
        <button type="button" role="radio" aria-checked={usePreferences} className={usePreferences ? 'is-active' : ''} onClick={() => onChange(true)}><i aria-hidden="true">✓</i><span><strong>Да, учитывай их</strong><small>AI мягко применит их к новому маршруту</small></span></button>
        <button type="button" role="radio" aria-checked={!usePreferences} className={!usePreferences ? 'is-active' : ''} onClick={() => onChange(false)}><i aria-hidden="true">○</i><span><strong>Нет, в этот раз без них</strong><small>План будет основан только на новом запросе</small></span></button>
      </div>
      <p className="planner-memory__note">Выбор сохранится как удобное значение по умолчанию, но его всегда можно поменять.</p>
    </section>
  );
}
