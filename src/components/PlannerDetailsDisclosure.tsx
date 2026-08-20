import { type ReactNode, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import './PlannerDetailsDisclosure.css';

type Props = { children: ReactNode };

export function PlannerDetailsDisclosure({ children }: Props) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="planner-details">
      <button
        className="planner-details__toggle"
        type="button"
        aria-expanded={isOpen}
        aria-controls="planner-extra-fields"
        onClick={() => setIsOpen((current) => !current)}
      >
        {t(isOpen ? 'planner.detailsClose' : 'planner.detailsOpen')}
        <span aria-hidden="true">⌄</span>
      </button>
      <div
        className={`planner-details__panel${isOpen ? ' is-open' : ''}`}
        id="planner-extra-fields"
        aria-hidden={!isOpen}
      >
        <fieldset disabled={!isOpen}>
          <div className="planner-details__content">{children}</div>
        </fieldset>
      </div>
    </div>
  );
}
