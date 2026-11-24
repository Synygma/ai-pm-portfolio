-- The parent's setup is saved step by step in setup_drafts too (0004 added `audience`), but
-- 0001 allowed only one draft per household, so her first save failed once the child had a
-- draft ("This page couldn't load" after choosing the companion). One draft per household
-- and side instead.
alter table public.setup_drafts drop constraint if exists setup_drafts_household_id_key;
create unique index if not exists setup_drafts_one_per_side on public.setup_drafts (household_id, audience);
