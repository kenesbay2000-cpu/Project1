-- Populate the cache from the live official source immediately after installation.
-- The function handles network failures and preserves the bootstrap snapshot.
select private.refresh_exchange_rates();
