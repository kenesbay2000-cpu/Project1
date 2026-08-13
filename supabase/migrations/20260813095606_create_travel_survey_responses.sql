-- Один актуальный ответ опросника на пользователя.
create table public.travel_survey_responses (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  origin_city text not null check (
    char_length(trim(origin_city)) between 1 and 120
  ),
  destination_city text not null check (
    char_length(trim(destination_city)) between 1 and 120
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.travel_survey_responses enable row level security;

create policy "read own travel survey response"
  on public.travel_survey_responses for select
  using (auth.uid() = user_id);

create policy "insert own travel survey response"
  on public.travel_survey_responses for insert
  with check (auth.uid() = user_id);

create policy "update own travel survey response"
  on public.travel_survey_responses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
