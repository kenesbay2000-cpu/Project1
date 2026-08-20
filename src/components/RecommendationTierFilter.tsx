import { useI18n } from '../i18n/I18nProvider';
import {
  recommendationTiers,
  type RecommendationTierCounts,
  type RecommendationTierFilterValue,
} from '../lib/recommendationTiers';
import './RecommendationTierFilter.css';

type Props = {
  value: RecommendationTierFilterValue;
  counts: RecommendationTierCounts;
  onChange: (value: RecommendationTierFilterValue) => void;
};

export function RecommendationTierFilter({ value, counts, onChange }: Props) {
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
          disabled={option !== 'all' && counts[option] === 0}
          onClick={() => onChange(option)}
        >
          <span>{t(`extras.tier.${option}`)}</span><small>{counts[option]}</small>
        </button>
      ))}
    </div>
  );
}
