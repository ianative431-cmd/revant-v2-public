-- Apple push device registration and per-user notification preferences.
-- Device tokens are accessible only to the server-side service role.
create table if not exists public.user_push_tokens (
  token text primary key check (token ~ '^[a-f0-9]{64}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform = 'ios'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_push_tokens_user_id_idx
  on public.user_push_tokens(user_id);

alter table public.user_push_tokens enable row level security;
revoke all on table public.user_push_tokens from anon, authenticated;
grant all on table public.user_push_tokens to service_role;

create table if not exists public.user_notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  orders boolean not null default true,
  payments boolean not null default true,
  messages boolean not null default true,
  deliveries boolean not null default true,
  promotions boolean not null default false,
  security boolean not null default true,
  system boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.user_notification_preferences enable row level security;
revoke all on table public.user_notification_preferences from anon;
grant select, insert, update on table public.user_notification_preferences to authenticated;
grant all on table public.user_notification_preferences to service_role;

drop policy if exists "users read own notification preferences"
  on public.user_notification_preferences;
create policy "users read own notification preferences"
  on public.user_notification_preferences
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users insert own notification preferences"
  on public.user_notification_preferences;
create policy "users insert own notification preferences"
  on public.user_notification_preferences
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users update own notification preferences"
  on public.user_notification_preferences;
create policy "users update own notification preferences"
  on public.user_notification_preferences
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
