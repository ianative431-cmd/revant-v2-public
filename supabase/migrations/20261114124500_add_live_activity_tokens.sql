-- Device-scoped ActivityKit push tokens for buyer delivery Live Activities.
-- Tokens are written and read only by authenticated server routes/service role.
create table if not exists public.user_live_activity_tokens (
  activity_id text primary key check (char_length(activity_id) between 1 and 128),
  token text not null unique check (token ~ '^[a-f0-9]{64}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_reference text not null check (char_length(order_reference) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_live_activity_tokens_user_order_idx
  on public.user_live_activity_tokens(user_id, order_reference);

alter table public.user_live_activity_tokens enable row level security;
revoke all on table public.user_live_activity_tokens from anon, authenticated;
grant all on table public.user_live_activity_tokens to service_role;
