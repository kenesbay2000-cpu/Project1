alter table public.exchange_rates
  drop constraint if exists exchange_rates_currency_check;

alter table public.exchange_rates
  add constraint exchange_rates_currency_check check (
    currency in ('KZT', 'USD', 'EUR', 'RUB', 'CNY', 'GBP', 'TRY', 'THB', 'KRW', 'VND')
  );

-- Last-known-good bootstrap values from the official NBK feed on 19 August 2026.
-- The live refresh below replaces all ten rows immediately when the source is available.
insert into public.exchange_rates (currency, kzt_per_unit, effective_date, fetched_at, source_url)
values
  ('RUB', 5.42, '2026-08-19', now(), 'https://nationalbank.kz/rss/rates_all.xml'),
  ('CNY', 68.25, '2026-08-19', now(), 'https://nationalbank.kz/rss/rates_all.xml'),
  ('GBP', 622.28, '2026-08-19', now(), 'https://nationalbank.kz/rss/rates_all.xml'),
  ('TRY', 9.60, '2026-08-19', now(), 'https://nationalbank.kz/rss/rates_all.xml'),
  ('THB', 13.92, '2026-08-19', now(), 'https://nationalbank.kz/rss/rates_all.xml'),
  ('KRW', 0.3263, '2026-08-19', now(), 'https://nationalbank.kz/rss/rates_all.xml'),
  ('VND', 0.01758, '2026-08-19', now(), 'https://nationalbank.kz/rss/rates_all.xml')
on conflict (currency) do nothing;

create or replace function private.refresh_exchange_rates()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  response_status integer;
  response_content text;
  rate_map jsonb;
  source_date date;
  last_success timestamptz;
  usd_rate numeric;
  eur_rate numeric;
  foreign_currencies constant text[] := array['USD', 'EUR', 'RUB', 'CNY', 'GBP', 'TRY', 'THB', 'KRW', 'VND'];
  source_url constant text := 'https://nationalbank.kz/rss/rates_all.xml';
begin
  select response.status, response.content
    into response_status, response_content
  from extensions.http_get(source_url) as response;

  if response_status <> 200 or response_content is null then
    raise exception 'NBK returned HTTP status %', coalesce(response_status::text, 'unknown');
  end if;

  select
    jsonb_object_agg(item.currency, item.rate_value / item.quantity),
    max(to_date(item.published, 'DD.MM.YYYY'))
  into rate_map, source_date
  from xmltable(
    '/rss/channel/item'
    passing xmlparse(document response_content)
    columns
      currency text path 'title/text()',
      published text path 'pubDate/text()',
      rate_value numeric path 'description/text()',
      quantity numeric path 'quant/text()'
  ) as item
  where item.currency = any(foreign_currencies) and item.quantity > 0;

  if rate_map is null or source_date is null or not (rate_map ?& foreign_currencies)
    or exists (select 1 from jsonb_each_text(rate_map) where value::numeric <= 0)
  then
    raise exception 'NBK response did not contain all required positive exchange rates';
  end if;

  usd_rate := (rate_map ->> 'USD')::numeric;
  eur_rate := (rate_map ->> 'EUR')::numeric;
  if usd_rate < 100 or usd_rate > 2000
    or eur_rate < 100 or eur_rate > 2500
    or eur_rate / usd_rate < 0.5 or eur_rate / usd_rate > 2
  then
    raise exception 'NBK response contained implausible reference rates';
  end if;

  insert into public.exchange_rates (currency, kzt_per_unit, effective_date, fetched_at, source_url)
  select entry.key, entry.value::numeric, source_date, now(), source_url
  from jsonb_each_text(rate_map) as entry
  union all
  select 'KZT', 1, source_date, now(), source_url
  on conflict (currency) do update set
    kzt_per_unit = excluded.kzt_per_unit,
    effective_date = excluded.effective_date,
    fetched_at = excluded.fetched_at,
    source_url = excluded.source_url;

  insert into private.exchange_rate_refresh_log (succeeded, effective_date, message)
  values (true, source_date, format('Stored %s official NBK exchange rates', cardinality(foreign_currencies) + 1));
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
  rate_count integer;
  required_currencies constant text[] := array['KZT', 'USD', 'EUR', 'RUB', 'CNY', 'GBP', 'TRY', 'THB', 'KRW', 'VND'];
begin
  select count(*), min(fetched_at) into rate_count, last_success
  from public.exchange_rates
  where currency = any(required_currencies);

  if rate_count <> cardinality(required_currencies)
    or last_success is null
    or last_success < date_trunc('week', now())
  then
    return private.refresh_exchange_rates();
  end if;
  return false;
end;
$$;

-- Verify the parser and populate all new currencies now instead of waiting for Monday.
select private.refresh_exchange_rates();
