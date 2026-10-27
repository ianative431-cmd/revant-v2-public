-- Calendrier social des vendeurs Revant. À appliquer dans Supabase avant activation de la page.
create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  caption text not null check (char_length(trim(caption)) between 1 and 2200),
  media_url text,
  product_url text,
  platforms text[] not null default array['manual']::text[],
  scheduled_at timestamptz not null,
  timezone text not null default 'Africa/Niamey',
  status text not null default 'scheduled' check (status in ('scheduled', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_posts_platforms_allowed check (platforms <@ array['instagram','facebook','tiktok','snapchat','whatsapp','manual']::text[])
);
create index if not exists social_posts_shop_schedule_idx on public.social_posts(shop_id, scheduled_at desc);
create index if not exists social_posts_due_idx on public.social_posts(status, scheduled_at) where status = 'scheduled';
create or replace function public.social_posts_set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists social_posts_updated_at on public.social_posts;
create trigger social_posts_updated_at before update on public.social_posts for each row execute function public.social_posts_set_updated_at();
alter table public.social_posts enable row level security;
drop policy if exists social_posts_owner_select on public.social_posts;
create policy social_posts_owner_select on public.social_posts for select to authenticated using (owner_id = auth.uid() and exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()));
drop policy if exists social_posts_owner_insert on public.social_posts;
create policy social_posts_owner_insert on public.social_posts for insert to authenticated with check (owner_id = auth.uid() and exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()));
drop policy if exists social_posts_owner_update on public.social_posts;
create policy social_posts_owner_update on public.social_posts for update to authenticated using (owner_id = auth.uid() and exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid())) with check (owner_id = auth.uid() and exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()));
grant select, insert, update on public.social_posts to authenticated;
