create table public.user_travel_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  preference_key text not null,
  label text not null,
  mention_count smallint not null default 1,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_travel_preferences_key_length check (char_length(preference_key) between 2 and 80),
  constraint user_travel_preferences_label_length check (char_length(label) between 2 and 180),
  constraint user_travel_preferences_mentions check (mention_count between 1 and 100),
  unique (user_id, preference_key)
);

alter table public.user_travel_preferences enable row level security;

create policy "read own travel preferences" on public.user_travel_preferences
  for select using (auth.uid() = user_id);
create policy "insert own travel preferences" on public.user_travel_preferences
  for insert with check (auth.uid() = user_id);
create policy "update own travel preferences" on public.user_travel_preferences
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own travel preferences" on public.user_travel_preferences
  for delete using (auth.uid() = user_id);

create table public.user_planner_settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  use_saved_preferences boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.user_planner_settings enable row level security;

create policy "read own planner settings" on public.user_planner_settings
  for select using (auth.uid() = user_id);
create policy "insert own planner settings" on public.user_planner_settings
  for insert with check (auth.uid() = user_id);
create policy "update own planner settings" on public.user_planner_settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own planner settings" on public.user_planner_settings
  for delete using (auth.uid() = user_id);
