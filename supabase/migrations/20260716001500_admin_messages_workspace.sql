alter table public.messages
  add column if not exists admin_status text not null default 'new',
  add column if not exists admin_reply text,
  add column if not exists replied_at timestamptz,
  add column if not exists reply_channel text,
  add column if not exists admin_updated_at timestamptz not null default now();

alter table public.messages drop constraint if exists messages_admin_status_check;
alter table public.messages add constraint messages_admin_status_check
  check (admin_status in ('new', 'in_progress', 'replied', 'archived'));

alter table public.messages drop constraint if exists messages_reply_channel_check;
alter table public.messages add constraint messages_reply_channel_check
  check (reply_channel is null or reply_channel in ('email', 'phone', 'sms', 'whatsapp', 'other'));

create index if not exists messages_admin_status_idx
  on public.messages (admin_status, created_at desc);
