-- ParCare: initial schema (child app phase; the parent app plugs into the same tables later).
-- Run once in Supabase: Dashboard -> SQL Editor -> paste this file -> Run.
--
-- Conventions
-- * Column names are the snake_case form of the TypeScript fields in src/data/types.ts.
-- * The app always supplies timestamps (so the demo clock works); no now() defaults.
-- * Every household-owned table cascades on household delete (deletion on request, G14).
-- * Row-level security: a signed-in child sees only rows of their own household.
--   The service role (used by /api/tick and the seed script) bypasses RLS.
-- * No health data in logs: nothing here logs row contents.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- People and households
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  pet_name text,
  country text,
  city text,
  age int check (age is null or age between 18 and 120),
  time_zone text not null,
  created_at timestamptz not null
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  -- v1: one household (one managed parent) per child.
  child_id uuid not null unique references public.profiles (id) on delete cascade,
  managed_parent_id uuid,
  -- Chosen by the parent. "my-child" is NOT an AI companion and can never be stored here.
  parent_avatar_id text check (
    parent_avatar_id is null or parent_avatar_id in (
      'krishna', 'shiva', 'guruji', 'trekker', 'champ', 'explorer',
      'sangeet-saathi', 'kalakaar', 'garden-mitra', 'masterchef', 'vidya'
    )
  ),
  gap_a_minutes int not null check (gap_a_minutes between 1 and 240),
  gap_b_minutes int not null check (gap_b_minutes between 1 and 240),
  digest_local_time text not null check (digest_local_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  demo_clock_offset_ms bigint not null default 0,
  setup_completed_at timestamptz,
  created_at timestamptz not null
);

create table public.parent_profiles (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  pet_name text not null,
  gender text check (gender is null or gender in ('female', 'male', 'other')),
  age int check (age is null or age between 18 and 120),
  country text,
  city text,
  time_zone text not null,
  managed boolean not null default false,
  created_at timestamptz not null
);

alter table public.households
  add constraint households_managed_parent_fk
  foreign key (managed_parent_id) references public.parent_profiles (id) on delete set null;

create table public.setup_drafts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null unique references public.households (id) on delete cascade,
  step int not null default 0,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null
);

-- ---------------------------------------------------------------------------
-- Check-ins
-- ---------------------------------------------------------------------------

create table public.meta_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  parent_id uuid not null references public.parent_profiles (id) on delete cascade,
  label text not null,
  checkin_type text not null check (checkin_type in (
    'woken_up', 'medicine', 'help_arrived', 'social', 'physical_activity', 'puja', 'appointment', 'last_checkin'
  )),
  local_time text check (local_time is null or local_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  on_date date,
  source text not null check (source in ('child', 'parent')),
  created_at timestamptz not null
);

-- G1: nothing is checked without the parent's consent, item by item.
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  meta_item_id uuid not null references public.meta_items (id) on delete cascade,
  granted_at timestamptz not null,
  revoked_at timestamptz,
  share_in_digest boolean not null default true
);

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  meta_item_id uuid not null references public.meta_items (id) on delete cascade,
  due_at timestamptz not null,
  status text not null check (status in ('scheduled', 'prompted1', 'prompted2', 'answered', 'escalated', 'acknowledged')),
  prompted1_at timestamptz,
  prompted2_at timestamptz,
  answered_at timestamptz,
  escalated_at timestamptz,
  acknowledged_at timestamptz
);
create index checkins_household_due on public.checkins (household_id, due_at);

create table public.responses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  checkin_id uuid references public.checkins (id) on delete set null,
  text text not null,
  outcome text check (outcome is null or outcome in ('yes', 'no', 'unclear')),
  audio_path text,
  created_at timestamptz not null
);
create index responses_household_created on public.responses (household_id, created_at);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  kind text not null check (kind in ('missed_checkin', 'emergency_word', 'all_disabled', 'review')),
  checkin_id uuid references public.checkins (id) on delete set null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null,
  ack_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Digest, helper, reminders
-- ---------------------------------------------------------------------------

create table public.digests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  sent_at timestamptz not null,
  items jsonb not null default '[]'::jsonb,
  flags jsonb not null default '[]'::jsonb
);

create table public.digest_feedback (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  digest_id uuid not null references public.digests (id) on delete cascade,
  verdict text not null check (verdict in ('matched', 'not_matched')),
  created_at timestamptz not null
);

create table public.helper_requests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  text text not null,
  audio_path text,
  status text not null check (status in ('new', 'seen', 'done')),
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table public.child_reminders (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  label text not null,
  audio_path text,
  is_sample boolean not null default false,
  due_at timestamptz not null,
  "repeat" text not null check ("repeat" in ('none', 'daily', 'weekly')),
  status text not null check (status in ('scheduled', 'ringing', 'parent_ok', 'snoozed')),
  created_at timestamptz not null
);

-- G7: stored only after the child confirms the person knows, so confirmed_told_at is required.
create table public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  phone text not null,
  confirmed_told_at timestamptz not null,
  created_at timestamptz not null
);

-- ---------------------------------------------------------------------------
-- Consent records, prompts, notifications, invites, chat
-- ---------------------------------------------------------------------------

create table public.terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  role text not null check (role in ('child', 'parent')),
  user_id uuid,
  terms_version text not null,
  accepted_at timestamptz not null
);

create table public.review_prompts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  audience text not null check (audience in ('child', 'parent')),
  due_at timestamptz not null,
  shown_at timestamptz,
  done_at timestamptz
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null
);

-- One-time parent invite: only the SHA-256 hash of the token is stored.
create table public.parent_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  kind text not null check (kind in ('setup', 'digest', 'alert', 'review', 'reminder', 'helper')),
  direction text not null check (direction in ('in', 'out')),
  ref_id uuid,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null,
  read_at timestamptz
);
create index chat_messages_household_created on public.chat_messages (household_id, created_at);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

-- True when the signed-in user is the child of this household. SECURITY DEFINER so the check
-- itself is not blocked by RLS on households.
create or replace function public.is_household_child(h uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.households where id = h and child_id = auth.uid());
$$;

revoke all on function public.is_household_child(uuid) from public;
grant execute on function public.is_household_child(uuid) to authenticated;

alter table public.profiles enable row level security;
create policy profiles_own on public.profiles
  for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

alter table public.households enable row level security;
create policy households_own on public.households
  for all to authenticated
  using (child_id = auth.uid())
  with check (child_id = auth.uid());

do $$
declare
  t text;
begin
  foreach t in array array[
    'parent_profiles', 'setup_drafts', 'meta_items', 'consents', 'checkins', 'responses', 'alerts',
    'digests', 'digest_feedback', 'helper_requests', 'child_reminders', 'emergency_contacts',
    'terms_acceptances', 'review_prompts', 'push_subscriptions', 'parent_invites', 'chat_messages'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %I on public.%I for all to authenticated '
      'using (public.is_household_child(household_id)) '
      'with check (public.is_household_child(household_id))',
      t || '_household_child', t
    );
  end loop;
end $$;

-- The anon role gets nothing: no policies grant it access to any table.

-- ---------------------------------------------------------------------------
-- Storage: private bucket for short voice clips (30-day retention, G15)
-- Files live at "<household_id>/<file>"; access uses short-lived signed URLs.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('voice', 'voice', false, 5242880, array['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav'])
on conflict (id) do nothing;

create policy voice_household_child on storage.objects
  for all to authenticated
  using (
    bucket_id = 'voice'
    and public.is_household_child(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'voice'
    and public.is_household_child(((storage.foldername(name))[1])::uuid)
  );
