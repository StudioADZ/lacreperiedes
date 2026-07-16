alter table public.secret_menu
  add column if not exists milkshake_special text,
  add column if not exists milkshake_special_description text,
  add column if not exists milkshake_special_price text,
  add column if not exists milkshake_special_image_url text,
  add column if not exists milkshake_special_video_url text,
  add column if not exists smoothie_special text,
  add column if not exists smoothie_special_description text,
  add column if not exists smoothie_special_price text,
  add column if not exists smoothie_special_image_url text,
  add column if not exists smoothie_special_video_url text;

create table if not exists public.user_weekly_offer_access_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_weekly_offer_access_codes enable row level security;

drop policy if exists "Users can read their weekly offer access code" on public.user_weekly_offer_access_codes;
create policy "Users can read their weekly offer access code"
  on public.user_weekly_offer_access_codes
  for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.get_or_create_weekly_offer_access_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_code text;
  generated_code text;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select access_code into existing_code
  from public.user_weekly_offer_access_codes
  where user_id = current_user_id;

  if existing_code is not null then
    return existing_code;
  end if;

  generated_code := 'SAVEURS-' || upper(substr(md5(current_user_id::text), 1, 8));

  insert into public.user_weekly_offer_access_codes (user_id, access_code)
  values (current_user_id, generated_code)
  on conflict (user_id) do update
    set updated_at = now()
  returning access_code into existing_code;

  return existing_code;
end;
$$;

grant execute on function public.get_or_create_weekly_offer_access_code() to authenticated;

create or replace function public.validate_weekly_offer_code(p_code text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_weekly_offer_access_codes
    where access_code = upper(trim(p_code))
  );
$$;

grant execute on function public.validate_weekly_offer_code(text) to anon, authenticated;

create or replace view public.secret_menu_public
with (security_invoker = true)
as
select
  id,
  week_start,
  menu_name,
  galette_special,
  galette_special_description,
  galette_special_price,
  galette_special_image_url,
  galette_special_video_url,
  crepe_special,
  crepe_special_description,
  crepe_special_price,
  crepe_special_image_url,
  crepe_special_video_url,
  milkshake_special,
  milkshake_special_description,
  milkshake_special_price,
  milkshake_special_image_url,
  milkshake_special_video_url,
  smoothie_special,
  smoothie_special_description,
  smoothie_special_price,
  smoothie_special_image_url,
  smoothie_special_video_url,
  valid_from,
  valid_to,
  is_active,
  created_at,
  updated_at
from public.secret_menu
where is_active = true;

grant select on public.secret_menu_public to anon, authenticated;
