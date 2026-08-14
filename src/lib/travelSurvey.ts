import { supabase } from './supabase';

export type TravelSurveyResponse = {
  userId: string;
  destinationCity: string;
  createdAt: string;
  updatedAt: string;
};

export type TravelVoteStats = {
  totalVotes: number;
  leadingDestination: string | null;
  topDestinations: TravelVoteDestination[];
};

export type TravelVoteDestination = { destination: string; votes: number };

type TravelSurveyRow = {
  user_id: string;
  destination_city: string;
  created_at: string;
  updated_at: string;
};

type TravelVoteStatsRow = {
  total_votes: number;
  leading_destination: string | null;
  top_destinations: unknown;
};

function parseTopDestinations(value: unknown): TravelVoteDestination[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return [];
    const row = item as Record<string, unknown>;
    if (typeof row.destination !== 'string' || typeof row.votes !== 'number') return [];
    return [{ destination: row.destination, votes: row.votes }];
  });
}

function normalizeCity(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function requireCity(value: string) {
  const city = normalizeCity(value);
  const length = Array.from(city).length;
  if (length === 0 || length > 120) {
    throw new Error('Название города должно содержать от 1 до 120 символов.');
  }
  return city;
}

function mapResponse(row: TravelSurveyRow): TravelSurveyResponse {
  return {
    userId: row.user_id,
    destinationCity: row.destination_city,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadTravelSurveyResponse() {
  const { data, error } = await supabase
    .from('travel_survey_responses')
    .select('user_id, destination_city, created_at, updated_at')
    .maybeSingle<TravelSurveyRow>();

  if (error) throw error;
  return data ? mapResponse(data) : null;
}

export async function saveTravelSurveyResponse(destinationCity: string) {
  const { data, error } = await supabase
    .from('travel_survey_responses')
    .upsert({
      destination_city: requireCity(destinationCity),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select('user_id, destination_city, created_at, updated_at')
    .single<TravelSurveyRow>();

  if (error) throw error;
  return mapResponse(data);
}

export async function loadTravelVoteStats(): Promise<TravelVoteStats> {
  const { data, error } = await supabase
    .rpc('get_travel_vote_stats')
    .single<TravelVoteStatsRow>();

  if (error) throw error;
  return {
    totalVotes: Number(data.total_votes),
    leadingDestination: data.leading_destination,
    topDestinations: parseTopDestinations(data.top_destinations),
  };
}
