-- Reactions and voice replies between the parent and the child (P-030).
-- A reply is a chat bubble of kind 'reply'; a voice reply's clip path is in its data (voice bucket),
-- deleted with the bubble and at the end of the family's keeping period.

alter table public.chat_messages drop constraint if exists chat_messages_kind_check;
alter table public.chat_messages
  add constraint chat_messages_kind_check check (kind in ('setup', 'digest', 'alert', 'review', 'reminder', 'helper', 'checkin', 'answer', 'note', 'reply'));
