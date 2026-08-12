create table public.travel_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  destination text not null,
  travelers smallint not null check (travelers between 1 and 30),
  days smallint not null check (days between 1 and 90),
  nights smallint not null check (nights between 0 and 89),
  travel_style text not null default 'comfort' check (travel_style in ('budget', 'comfort', 'premium')),
  budget_min numeric(12, 2) check (budget_min >= 0),
  budget_max numeric(12, 2) check (budget_max >= budget_min),
  currency char(3) not null default 'KZT',
  interests text[] not null default '{}',
  itinerary jsonb not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'planned', 'booked', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.travel_plans enable row level security;

create policy "read own travel plans" on public.travel_plans
  for select using (auth.uid() = user_id);
create policy "insert own travel plans" on public.travel_plans
  for insert with check (auth.uid() = user_id);
create policy "update own travel plans" on public.travel_plans
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own travel plans" on public.travel_plans
  for delete using (auth.uid() = user_id);

create index travel_plans_user_id_created_at_idx
  on public.travel_plans (user_id, created_at desc);
