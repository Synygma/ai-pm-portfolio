-- 0004: the parent app (docs/PLAN-PARENT.md, P-012). Run after 0001–0003.
--
-- The parent never gets a database login: her app talks to the server, which uses the service
-- role and always scopes to her household (src/data/parent-access.ts). So no new RLS policies
-- are needed for her; parent_sessions has RLS on with no policies (server only).

-- Parent setup state and last visit.
alter table public.parent_profiles add column setup_completed_at timestamptz;
alter table public.parent_profiles add column last_seen_at timestamptz;

-- Parent device sessions (from the invite link; 90 days). Only a hash of the secret is stored.
create table public.parent_sessions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  parent_id uuid not null references public.parent_profiles (id) on delete cascade,
  secret_hash text not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null
);
create index parent_sessions_household on public.parent_sessions (household_id);
alter table public.parent_sessions enable row level security;

-- Each side has its own companion chat; check-in prompts and the parent's answers are new kinds.
alter table public.chat_messages add column audience text not null default 'child' check (audience in ('child', 'parent'));
alter table public.chat_messages drop constraint if exists chat_messages_kind_check;
alter table public.chat_messages
  add constraint chat_messages_kind_check check (kind in ('setup', 'digest', 'alert', 'review', 'reminder', 'helper', 'checkin', 'answer'));

-- Snooze (F3): the check-in comes back at snoozed_until.
alter table public.checkins add column snoozed_until timestamptz;
alter table public.checkins drop constraint if exists checkins_status_check;
alter table public.checkins
  add constraint checkins_status_check check (status in ('scheduled', 'prompted1', 'prompted2', 'answered', 'escalated', 'acknowledged', 'lapsed', 'snoozed'));

-- The parent's setup is saved step by step too.
alter table public.setup_drafts add column audience text not null default 'child' check (audience in ('child', 'parent'));

-- Push to the parent's phone as well as the child's. A parent subscription has no auth user.
alter table public.push_subscriptions add column audience text not null default 'child' check (audience in ('child', 'parent'));
alter table public.push_subscriptions alter column user_id drop not null;

-- How the parent answered.
alter table public.responses add column source text check (source is null or source in ('button', 'voice', 'typed'));
