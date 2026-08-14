alter table public.travel_plans
  add column client_id uuid not null default gen_random_uuid(),
  add column title text,
  add column destination_country text,
  add column origin_city text,
  add column start_date date,
  add column end_date date,
  add column planner_request jsonb not null default '{}'::jsonb;

alter table public.travel_plans
  add constraint travel_plans_dates_order_check
  check (start_date is null or end_date is null or start_date <= end_date);

create unique index travel_plans_user_id_client_id_idx
  on public.travel_plans (user_id, client_id);
