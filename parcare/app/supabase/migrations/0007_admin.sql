-- Admin page (P-027): gentle check-in notes from the ParCare team to children's apps.
-- A note shows as a chat bubble of kind 'note' in the child's chat; each sending is logged.
-- Only the server (service role) reads or writes admin_broadcasts: RLS on, no policies.

alter table public.chat_messages drop constraint if exists chat_messages_kind_check;
alter table public.chat_messages
  add constraint chat_messages_kind_check check (kind in ('setup', 'digest', 'alert', 'review', 'reminder', 'helper', 'checkin', 'answer', 'note'));

create table public.admin_broadcasts (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  preset text,
  sent_at timestamptz not null,
  families integer not null,
  pushed integer not null
);
alter table public.admin_broadcasts enable row level security;
