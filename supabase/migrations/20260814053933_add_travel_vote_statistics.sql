create function public.get_travel_vote_stats()
returns table (
  total_votes bigint,
  leading_destination text,
  leader_votes bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with grouped_votes as (
    select destination_city, count(*) as vote_count
    from public.travel_survey_responses
    group by destination_city
  )
  select
    (select count(*) from public.travel_survey_responses) as total_votes,
    (select destination_city from grouped_votes order by vote_count desc, destination_city asc limit 1),
    coalesce((select vote_count from grouped_votes order by vote_count desc, destination_city asc limit 1), 0);
$$;

revoke all on function public.get_travel_vote_stats() from public;
grant execute on function public.get_travel_vote_stats() to anon, authenticated;
