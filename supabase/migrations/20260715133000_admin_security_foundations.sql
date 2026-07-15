-- Admin security foundations
-- Uses the existing public.app_role enum, public.user_roles table and public.has_role function.

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id) on delete restrict,
  admin_email text,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_logs enable row level security;

revoke all on public.admin_audit_logs from anon, authenticated;
grant select on public.admin_audit_logs to authenticated;

create policy "Admins can read audit logs"
on public.admin_audit_logs
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Harden role records: authenticated users cannot grant themselves a role.
alter table public.user_roles enable row level security;
revoke insert, update, delete on public.user_roles from anon, authenticated;
grant select on public.user_roles to authenticated;

create policy "Users can read their own role"
on public.user_roles
for select
to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role));

-- Bootstrap the restaurant business account when it already exists.
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where lower(email) = 'dlacreperie@gmail.com'
and not exists (
  select 1 from public.user_roles ur
  where ur.user_id = auth.users.id and ur.role = 'admin'::public.app_role
);

create index if not exists admin_audit_logs_created_at_idx
on public.admin_audit_logs (created_at desc);

create index if not exists admin_audit_logs_admin_user_id_idx
on public.admin_audit_logs (admin_user_id, created_at desc);
