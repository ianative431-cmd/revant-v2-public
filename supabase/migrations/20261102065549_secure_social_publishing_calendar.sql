-- This migration is already present in the active Supabase project's migration history.
-- This repository copy restores the missing source file; do not re-apply it to the live project.
create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  caption text not null,
  media_url text,
  product_url text,
  platforms text[] not null default array['manual']::text[],
  scheduled_at timestamptz not null,
  timezone text not null default 'Africa/Niamey',
  status text not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_posts_caption_check
    check (char_length(trim(caption)) >= 1 and char_length(trim(caption)) <= 2200),
  constraint social_posts_media_https
    check (media_url is null or media_url ~* '^https://'),
  constraint social_posts_product_https
    check (product_url is null or product_url ~* '^https://'),
  constraint social_posts_platforms_allowed
    check (
      cardinality(platforms) > 0
      and platforms <@ array['instagram','facebook','tiktok','snapchat','whatsapp','manual']::text[]
    ),
  constraint social_posts_status_check
    check (status = any (array['scheduled','cancelled']::text[])),
  constraint social_posts_timezone_check
    check (char_length(trim(timezone)) >= 1 and char_length(trim(timezone)) <= 80)
);

alter table public.social_posts enable row level security;

create index if not exists revant_fk_social_posts_owner_id_idx
  on public.social_posts using btree (owner_id);

create index if not exists social_posts_due_idx
  on public.social_posts using btree (status, scheduled_at)
  where status = 'scheduled';

create index if not exists social_posts_shop_schedule_idx
  on public.social_posts using btree (shop_id, scheduled_at);

create or replace function public.social_posts_set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

drop trigger if exists social_posts_updated_at on public.social_posts;
create trigger social_posts_updated_at
before update on public.social_posts
for each row execute function public.social_posts_set_updated_at();

drop policy if exists social_posts_owner_insert on public.social_posts;
create policy social_posts_owner_insert
on public.social_posts
for insert to authenticated
with check (
  owner_id = (select auth.uid())
  and exists (
    select 1 from public.shops s
    where s.id = social_posts.shop_id
      and s.owner_id = (select auth.uid())
  )
);

drop policy if exists social_posts_owner_select on public.social_posts;
create policy social_posts_owner_select
on public.social_posts
for select to authenticated
using (
  owner_id = (select auth.uid())
  and exists (
    select 1 from public.shops s
    where s.id = social_posts.shop_id
      and s.owner_id = (select auth.uid())
  )
);

drop policy if exists social_posts_owner_update on public.social_posts;
create policy social_posts_owner_update
on public.social_posts
for update to authenticated
using (
  owner_id = (select auth.uid())
  and exists (
    select 1 from public.shops s
    where s.id = social_posts.shop_id
      and s.owner_id = (select auth.uid())
  )
)
with check (
  owner_id = (select auth.uid())
  and exists (
    select 1 from public.shops s
    where s.id = social_posts.shop_id
      and s.owner_id = (select auth.uid())
  )
);

revoke all on public.social_posts from anon;
grant select, insert, update on public.social_posts to authenticated;
grant all on public.social_posts to service_role;
