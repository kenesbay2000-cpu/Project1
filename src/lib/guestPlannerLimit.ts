const GUEST_PLAN_KEY = 'roamly.guest-completed-plan.v1';

function hasMarker(storage: Storage) {
  try {
    return storage.getItem(GUEST_PLAN_KEY) === 'completed';
  } catch {
    return false;
  }
}

function setMarker(storage: Storage) {
  try {
    storage.setItem(GUEST_PLAN_KEY, 'completed');
  } catch {
    // The other browser storage remains a best-effort fallback.
  }
}

export function hasGuestCompletedPlan() {
  return hasMarker(window.localStorage) || hasMarker(window.sessionStorage);
}

export function recordGuestCompletedPlan() {
  setMarker(window.localStorage);
  setMarker(window.sessionStorage);
}
