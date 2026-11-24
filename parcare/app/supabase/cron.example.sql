-- ParCare scheduler: call /api/tick every minute (Supabase free plan: pg_cron + pg_net).
-- Vercel Hobby cron runs only once a day, so the database drives the minute-by-minute tick.
--
-- Run ONCE in Supabase -> SQL Editor, AFTER the app is deployed to Vercel and CRON_SECRET is set
-- in Vercel's environment variables. Replace the two placeholders below first.
-- This file is a template: never commit your real URL + secret back into it.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'parcare-tick',
  '* * * * *',
  $$
  select net.http_post(
    url     := 'https://YOUR-APP.vercel.app/api/tick',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_CRON_SECRET',
      'Content-Type', 'application/json'
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
  $$
);

-- Check it is running:   select * from cron.job_run_details order by start_time desc limit 5;
-- Stop it:               select cron.unschedule('parcare-tick');
