-- Holy Grail dashboard schema.
-- One settings row per user. Many positions per user. Both RLS-locked to auth.uid().
--
-- Run this once in Supabase → SQL Editor → New query → paste → Run.
-- Idempotent: safe to re-run.

create extension if not exists pgcrypto;

-- ─────────────────────────── profiles ─────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_upsert_own" on public.profiles;
create policy "profiles_upsert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- ─────────────────────────── settings ─────────────────────────────
-- One row per user — the inputs from the SL Calculator + Capital Allocation blocks.
create table if not exists public.dashboard_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  market_condition text not null default 'Confirmed Uptrend'
    check (market_condition in ('Downtrend','Rally Attempt','Confirmed Uptrend')),
  strategy_limits numeric not null default 0.10,
  entry_price numeric not null default 0,
  stop_loss numeric not null default 0,
  core_capital numeric not null default 1000000,
  invested_amount numeric not null default 0,
  cash_available numeric not null default 1000000,
  active_trades integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.dashboard_settings enable row level security;

drop policy if exists "settings_select_own" on public.dashboard_settings;
create policy "settings_select_own" on public.dashboard_settings
  for select using (auth.uid() = user_id);

drop policy if exists "settings_insert_own" on public.dashboard_settings;
create policy "settings_insert_own" on public.dashboard_settings
  for insert with check (auth.uid() = user_id);

drop policy if exists "settings_update_own" on public.dashboard_settings;
create policy "settings_update_own" on public.dashboard_settings
  for update using (auth.uid() = user_id);

drop policy if exists "settings_delete_own" on public.dashboard_settings;
create policy "settings_delete_own" on public.dashboard_settings
  for delete using (auth.uid() = user_id);

-- ─────────────────────────── positions ────────────────────────────
create table if not exists public.positions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  stock text not null,
  allocation numeric not null default 0,
  cap_at_entry numeric not null default 0,
  entry_price numeric not null default 0,
  stop_loss numeric not null default 0,
  sector text,
  setup text,
  tranche text not null default 'T1' check (tranche in ('T1','T2','T3')),
  status text not null default 'Active' check (status in ('Active','Order Placed','Closed')),
  qty_override integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists positions_user_idx on public.positions(user_id, created_at);

alter table public.positions enable row level security;

drop policy if exists "positions_select_own" on public.positions;
create policy "positions_select_own" on public.positions
  for select using (auth.uid() = user_id);

drop policy if exists "positions_insert_own" on public.positions;
create policy "positions_insert_own" on public.positions
  for insert with check (auth.uid() = user_id);

drop policy if exists "positions_update_own" on public.positions;
create policy "positions_update_own" on public.positions
  for update using (auth.uid() = user_id);

drop policy if exists "positions_delete_own" on public.positions;
create policy "positions_delete_own" on public.positions
  for delete using (auth.uid() = user_id);

-- ─────────────────────────── auth trigger ─────────────────────────
-- Auto-create a profile + default settings on first sign-in.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.dashboard_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
