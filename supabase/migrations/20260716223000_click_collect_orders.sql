create table if not exists public.click_collect_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  customer_email text,
  customer_phone text not null,
  pickup_date date not null,
  pickup_time time not null,
  status text not null default 'pending' check (status in ('pending','confirmed','preparing','ready','collected','cancelled')),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','refunded','failed')),
  payment_provider text,
  payment_reference text,
  subtotal numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  notes text,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists click_collect_orders_pickup_idx on public.click_collect_orders (pickup_date, pickup_time);
create index if not exists click_collect_orders_status_idx on public.click_collect_orders (status, payment_status);

alter table public.click_collect_orders enable row level security;

comment on table public.click_collect_orders is 'Commandes à emporter du futur service click and collect.';
comment on column public.click_collect_orders.items is 'Articles commandés : galettes, crêpes, milkshakes, smoothies et compléments.';