import type { PlannerRequest } from './aiPlanner';

export function applyPreferenceSelection(request: PlannerRequest, preferences: string[], usePreferences: boolean) {
  return usePreferences && preferences.length ? { ...request, savedPreferences: preferences.slice(0, 12) } : request;
}

export function preferenceDefault(savedValue: boolean | null | undefined) {
  return savedValue ?? true;
}
