-- 0003: changes requested after C8 (P-011). Run after 0001 and 0002.

-- Item 2: the child can "Skip" a digest instead of Matched / Did not match.
alter table public.digest_feedback drop constraint if exists digest_feedback_verdict_check;
alter table public.digest_feedback
  add constraint digest_feedback_verdict_check check (verdict in ('matched', 'not_matched', 'skipped'));

-- Item 3: how long the parent's words, voice clips and digests are kept (8 days, 15 days or a
-- month; a month is the longest and the default, G15).
alter table public.households
  add column retention_days int not null default 30 check (retention_days in (8, 15, 30));

-- Item 0: proof that a user agreed to "what ParCare can and cannot do" + terms before first use.
-- Kept even after "Delete all our data": no foreign key to the account on purpose, and no update
-- or delete policy, so the app can only add and read its own rows. The internet address is never
-- stored, only a salted one-way fingerprint of it (ip_hash).
create table public.terms_agreements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  terms_version text not null,
  accepted_at timestamptz not null,
  ip_hash text
);
create index terms_agreements_user on public.terms_agreements (user_id);
alter table public.terms_agreements enable row level security;
create policy terms_agreements_insert_own on public.terms_agreements
  for insert to authenticated with check (user_id = auth.uid());
create policy terms_agreements_select_own on public.terms_agreements
  for select to authenticated using (user_id = auth.uid());
