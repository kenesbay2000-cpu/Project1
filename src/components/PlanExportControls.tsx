import { useState } from 'react';
import type { GeneratedTrip } from '../lib/aiPlanner';
import { useI18n } from '../i18n/I18nProvider';
import { downloadTripPdf, isTripPdfTimeout } from '../lib/tripPdf';

export function PlanExportControls({ trip }: { trip: GeneratedTrip }) {
  const { t, language } = useI18n();
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');

  async function download() {
    if (isDownloading) return;
    setError('');
    setIsDownloading(true);
    try { await downloadTripPdf(trip, language, t); }
    catch (error) { setError(t(isTripPdfTimeout(error) ? 'export.timeoutError' : 'export.error')); }
    finally { setIsDownloading(false); }
  }

  return <div className="plan-export" role="group" aria-label={t('export.actions')}>
    <span>{t('export.actions')}</span>
    <div>
      <button className="plan-export__pdf" type="button" onClick={() => void download()} disabled={isDownloading}>
        <DownloadIcon /> {isDownloading ? t('export.downloadingPdf') : t('export.downloadPdf')}
      </button>
      <button className="plan-export__print" type="button" onClick={() => window.print()}><PrintIcon /> {t('export.print')}</button>
    </div>
    {error && <p role="alert">{error}</p>}
  </div>;
}

function DownloadIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 5-5m-5 5-5-5M5 19h14" /></svg>;
}

function PrintIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7z" /></svg>;
}
