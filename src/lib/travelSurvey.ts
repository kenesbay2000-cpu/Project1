import { supabase } from './supabase';

export type TravelSurveyResponse = {
  userId: string;
  originCity: string;
  destinationCity: string;
  createdAt: string;
  updatedAt: string;
};

type TravelSurveyRow = {
  user_id: string;
  origin_city: string;
  destination_city: string;
  created_at: string;
  updated_at: string;
};

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
    originCity: row.origin_city,
    destinationCity: row.destination_city,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadTravelSurveyResponse() {
  const { data, error } = await supabase
    .from('travel_survey_responses')
    .select('user_id, origin_city, destination_city, created_at, updated_at')
    .maybeSingle<TravelSurveyRow>();

  if (error) throw error;
  return data ? mapResponse(data) : null;
}

export async function saveTravelSurveyResponse(originCity: string, destinationCity: string) {
  const { data, error } = await supabase
    .from('travel_survey_responses')
    .upsert({
      origin_city: requireCity(originCity),
      destination_city: requireCity(destinationCity),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select('user_id, origin_city, destination_city, created_at, updated_at')
    .single<TravelSurveyRow>();

  if (error) throw error;
  return mapResponse(data);
}
