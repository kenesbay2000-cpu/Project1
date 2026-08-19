import { useI18n } from '../i18n/I18nProvider';
import {
  recommendationTiers,
  type RecommendationTierFilterValue,
} from '../lib/recommendationTiers';
import './RecommendationTierFilter.css';

type Props = {
  value: RecommendationTierFilterValue;
  onChange: (value: RecommendationTierFilterValue) => void;
};

export function RecommendationTierFilter({ value, onChange }: Props) {
  const { t } = useI18n();
  const options: RecommendationTierFilterValue[] = ['all', ...recommendationTiers];
  return (
    <div className="recommendation-filter" role="group" aria-label={t('extras.tierFilter')}>
      {options.map((option) => (
        <button
          className={value === option ? 'is-active' : ''}
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
        >
          {t(`extras.tier.${option}`)}
        </button>
      ))}
    </div>
  );
}
