-- Central exchange-rate cache for AI budget checks.
-- Source: National Bank of Kazakhstan official daily rates.

create extension if not exists http with schema extensions;
create extension if not exists pg_cron;

create table public.exchange_rates (
  currency text primary key check (currency in ('KZT', 'USD', 'EUR')),
  base_currency text not null default 'KZT' check (base_currency = 'KZT'),
  kzt_per_unit numeric(18, 8) not null check (kzt_per_unit > 0),
  effective_date date not null,
  fetched_at timestamptz not null,
  source_url text not null
);

alter table public.exchange_rates enable row level security;

create policy "exchange rates are readable"
  on public.exchange_rates for select
  to anon, authenticated
  using (true);

grant select on public.exchange_rates to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public.exchange_rates from anon, authenticated;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.exchange_rate_refresh_log (
  id bigint generated always as identity primary key,
  attempted_at timestamptz not null default now(),
  succeeded boolean not null,
  effective_date date,
  message text not null
);

alter table private.exchange_rate_refresh_log enable row level security;

-- Initial official snapshot obtained from the same NBK feed on 19 August 2026.
-- It guarantees a usable last-known-good value before the first scheduled run.
insert into public.exchange_rates (currency, kzt_per_unit, effective_date, fetched_at, source_url)
values
  ('KZT', 1, '2026-08-19', now(), 'https://nationalbank.kz/rss/rates_all.xml'),
  ('USD', 460.13, '2026-08-19', now(), 'https://nationalbank.kz/rss/rates_all.xml'),
  ('EUR', 532.60, '2026-08-19', now(), 'https://nationalbank.kz/rss/rates_all.xml');

create or replace function private.refresh_exchange_rates()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  response_status integer;
  response_content text;
  usd_rate numeric;
  eur_rate numeric;
  source_date date;
  last_success timestamptz;
  source_url constant text := 'https://nationalbank.kz/rss/rates_all.xml';
begin
  select response.status, response.content
    into response_status, response_content
  from extensions.http_get(source_url) as response;

  if response_status <> 200 or response_content is null then
    raise exception 'NBK returned HTTP status %', coalesce(response_status::text, 'unknown');
  end if;

  select
    max(case when item.currency = 'USD' then item.rate_value / item.quantity end),
    max(case when item.currency = 'EUR' then item.rate_value / item.quantity end),
    max(to_date(item.published, 'DD.MM.YYYY'))
  into usd_rate, eur_rate, source_date
  from xmltable(
    '/rss/channel/item'
    passing xmlparse(document response_content)
    columns
      currency text path 'title/text()',
      published text path 'pubDate/text()',
      rate_value numeric path 'description/text()',
      quantity numeric path 'quant/text()'
  ) as item
  where item.currency in ('USD', 'EUR') and item.quantity > 0;

  if usd_rate is null or eur_rate is null or source_date is null
    or usd_rate < 100 or usd_rate > 2000
    or eur_rate < 100 or eur_rate > 2500
    or eur_rate / usd_rate < 0.5 or eur_rate / usd_rate > 2
  then
    raise exception 'NBK response did not contain plausible USD and EUR rates';
  end if;

  insert into public.exchange_rates (currency, kzt_per_unit, effective_date, fetched_at, source_url)
  values
    ('KZT', 1, source_date, now(), source_url),
    ('USD', usd_rate, source_date, now(), source_url),
    ('EUR', eur_rate, source_date, now(), source_url)
  on conflict (currency) do update set
    kzt_per_unit = excluded.kzt_per_unit,
    effective_date = excluded.effective_date,
    fetched_at = excluded.fetched_at,
    source_url = excluded.source_url;

  insert into private.exchange_rate_refresh_log (succeeded, effective_date, message)
  values (true, source_date, format('Stored NBK rates: USD=%s KZT, EUR=%s KZT', usd_rate, eur_rate));
  return true;
exception when others then
  select min(fetched_at) into last_success from public.exchange_rates;
  insert into private.exchange_rate_refresh_log (succeeded, message)
  values (false, left(sqlerrm, 1000));
  if last_success is null or last_success < now() - interval '14 days' then
    raise warning 'Exchange rates are stale for more than 14 days. Refresh failed: %', sqlerrm;
  else
    raise warning 'Exchange-rate refresh failed; keeping last successful rates: %', sqlerrm;
  end if;
  return false;
end;
$$;

create or replace function private.retry_exchange_rates_if_stale()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  last_success timestamptz;
begin
  select min(fetched_at) into last_success
  from public.exchange_rates
  where currency in ('KZT', 'USD', 'EUR');

  if last_success is null or last_success < date_trunc('week', now()) then
    return private.refresh_exchange_rates();
  end if;
  return false;
end;
$$;

revoke all on function private.refresh_exchange_rates() from public, anon, authenticated;
revoke all on function private.retry_exchange_rates_if_stale() from public, anon, authenticated;

select cron.unschedule(jobid) from cron.job where jobname in (
  'refresh-exchange-rates-monday',
  'retry-exchange-rates-tuesday-saturday'
);

select cron.schedule(
  'refresh-exchange-rates-monday',
  '10 3 * * 1',
  'select private.refresh_exchange_rates()'
);

select cron.schedule(
  'retry-exchange-rates-tuesday-saturday',
  '10 3 * * 2-6',
  'select private.retry_exchange_rates_if_stale()'
);
