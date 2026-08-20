import type { TravelDataWarning } from '../lib/aiPlannerTypes';

export function TravelDataWarnings({ warnings }: { warnings?: TravelDataWarning[] }) {
  if (!warnings?.length) return null;
  return (
    <aside className="travel-data-warnings" role="status">
      {warnings.map((warning) => <p key={`${warning.section}-${warning.city}`}><strong>{warning.city}</strong><span>{warning.message}</span></p>)}
    </aside>
  );
}
