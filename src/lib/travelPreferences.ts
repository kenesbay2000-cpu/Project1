import { supabase } from './supabase';
import { preferenceDefault } from './preferenceSelection';

export type TravelPreference = {
  id: string;
  key: string;
  label: string;
  mentionCount: number;
  isActive: boolean;
};

export type PreferenceCandidate = { key: string; label: string; explicit: boolean };
export type PreferenceProfile = {
  active: TravelPreference[];
  signals: TravelPreference[];
  useByDefault: boolean;
};

type PreferenceRow = {
  id: string;
  preference_key: string;
  label: string;
  mention_count: number;
  is_active: boolean;
};

function mapPreference(row: PreferenceRow): TravelPreference {
  return { id: row.id, key: row.preference_key, label: row.label, mentionCount: row.mention_count, isActive: row.is_active };
}

export async function loadPreferenceProfile(userId: string): Promise<PreferenceProfile> {
  const [preferencesResult, settingsResult] = await Promise.all([
    supabase.from('user_travel_preferences').select('id, preference_key, label, mention_count, is_active').eq('user_id', userId).order('updated_at', { ascending: false }),
    supabase.from('user_planner_settings').select('use_saved_preferences').eq('user_id', userId).maybeSingle(),
  ]);
  if (preferencesResult.error) throw preferencesResult.error;
  if (settingsResult.error) throw settingsResult.error;
  const signals = (preferencesResult.data as PreferenceRow[]).map(mapPreference);
  return { signals, active: signals.filter((item) => item.isActive), useByDefault: preferenceDefault(settingsResult.data?.use_saved_preferences) };
}

export async function savePreferenceDefault(userId: string, useSavedPreferences: boolean) {
  const { error } = await supabase.from('user_planner_settings').upsert({
    user_id: userId,
    use_saved_preferences: useSavedPreferences,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function recordPreferenceCandidates(userId: string, known: TravelPreference[], candidates: PreferenceCandidate[]) {
  const existing = new Map(known.map((item) => [item.key, item]));
  for (const candidate of candidates.slice(0, 5)) {
    const previous = existing.get(candidate.key);
    const mentionCount = Math.min(100, (previous?.mentionCount ?? 0) + 1);
    const isActive = previous?.isActive || candidate.explicit || mentionCount >= 2;
    const { error } = await supabase.from('user_travel_preferences').upsert({
      user_id: userId,
      preference_key: candidate.key,
      label: candidate.label,
      mention_count: mentionCount,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,preference_key' });
    if (error) throw error;
    existing.set(candidate.key, { id: previous?.id ?? '', key: candidate.key, label: candidate.label, mentionCount, isActive });
  }
}

export async function addTravelPreference(userId: string, label: string) {
  const { error } = await supabase.from('user_travel_preferences').insert({
    user_id: userId, preference_key: `manual-${crypto.randomUUID()}`, label, mention_count: 1, is_active: true,
  });
  if (error) throw error;
}

export async function updateTravelPreference(id: string, label: string) {
  const { error } = await supabase.from('user_travel_preferences').update({ label, is_active: true, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function deleteTravelPreference(id: string) {
  const { error } = await supabase.from('user_travel_preferences').delete().eq('id', id);
  if (error) throw error;
}

export async function clearTravelPreferences(userId: string) {
  const { error } = await supabase.from('user_travel_preferences').delete().eq('user_id', userId);
  if (error) throw error;
}
