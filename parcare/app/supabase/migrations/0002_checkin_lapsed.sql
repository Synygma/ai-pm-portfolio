-- C5: a check-in that fell due while the scheduler was not running is "lapsed": the parent was
-- never prompted, so no alarm is raised for it. Run after 0001_init.sql.
alter table public.checkins drop constraint if exists checkins_status_check;
alter table public.checkins add constraint checkins_status_check
  check (status in ('scheduled', 'prompted1', 'prompted2', 'answered', 'escalated', 'acknowledged', 'lapsed'));
create index if not exists alerts_household_ack on public.alerts (household_id, ack_at);
