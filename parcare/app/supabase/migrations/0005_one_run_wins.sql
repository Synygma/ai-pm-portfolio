-- 0005: the scheduler can run twice at the same moment (the every-minute timer plus open apps in
-- demo mode). These unique indexes make sure the same check-in, digest or review prompt is never
-- created twice; the app treats a refused duplicate as "another run already did it".
-- Run after 0001-0004.

create unique index if not exists checkins_one_per_due on public.checkins (household_id, meta_item_id, due_at);
create unique index if not exists digests_one_per_period on public.digests (household_id, period_end);
create unique index if not exists review_prompts_one_per_due on public.review_prompts (household_id, audience, due_at);
