import { useI18n } from '../i18n/I18nProvider';

type Props = { isLoading: boolean; error: string; onRetry: () => void };

export function DeferredPlanSection({ isLoading, error, onRetry }: Props) {
  const { t } = useI18n();
  return (
    <div className="saved-workspace__deferred" role={error ? 'alert' : 'status'}>
      {isLoading && <><span aria-hidden="true" /><p>{t('workspace.lazyLoading')}</p></>}
      {!isLoading && error && <><p>{error || t('workspace.lazyError')}</p><button type="button" onClick={onRetry}>{t('workspace.lazyRetry')}</button></>}
    </div>
  );
}
