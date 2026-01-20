-- 1) Table
create table if not exists public.carte_public (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- période optionnelle (si tu veux une carte datée)
  valid_from date null,
  valid_to date null,

  is_active boolean not null default true,

  -- contenu
  galette_items jsonb not null default '[]'::jsonb,
  crepe_items jsonb not null default '[]'::jsonb
);

-- 2) updated_at auto
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_carte_public_updated_at on public.carte_public;
create trigger trg_carte_public_updated_at
before update on public.carte_public
for each row execute function public.set_updated_at();

-- 3) Index utile
create index if not exists idx_carte_public_active on public.carte_public (is_active, created_at desc);
