-- One phone can get notifications as a child in one family and as a parent in another (team test,
-- P-034). The old rule allowed each browser's push address only once in the whole database, so
-- saving it for the second role failed and that role got no notifications.

alter table public.push_subscriptions drop constraint if exists push_subscriptions_endpoint_key;
create unique index if not exists push_subscriptions_endpoint_role on public.push_subscriptions (endpoint, household_id, audience);
