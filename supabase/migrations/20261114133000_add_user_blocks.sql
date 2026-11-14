-- User-to-user blocks for marketplace messaging safety.
create table if not exists public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint user_blocks_no_self_block check (blocker_id <> blocked_id)
);

create index if not exists user_blocks_blocked_id_idx
  on public.user_blocks(blocked_id);

alter table public.user_blocks enable row level security;
revoke all on table public.user_blocks from anon;
grant select, insert, delete on table public.user_blocks to authenticated;
grant all on table public.user_blocks to service_role;

drop policy if exists "users view own block relationships" on public.user_blocks;
create policy "users view own block relationships"
  on public.user_blocks
  for select to authenticated
  using (blocker_id = auth.uid() or blocked_id = auth.uid());

drop policy if exists "users block other accounts" on public.user_blocks;
create policy "users block other accounts"
  on public.user_blocks
  for insert to authenticated
  with check (blocker_id = auth.uid() and blocked_id <> auth.uid());

drop policy if exists "users unblock accounts they blocked" on public.user_blocks;
create policy "users unblock accounts they blocked"
  on public.user_blocks
  for delete to authenticated
  using (blocker_id = auth.uid());

-- Prevent new conversations when either participant has blocked the other.
drop policy if exists "participants create conversations" on public.conversations;
create policy "participants create conversations"
  on public.conversations
  for insert to authenticated
  with check (
    (buyer_id = auth.uid() or seller_id = auth.uid())
    and not exists (
      select 1
      from public.user_blocks b
      where
        (b.blocker_id = auth.uid() and b.blocked_id in (buyer_id, seller_id))
        or
        (b.blocked_id = auth.uid() and b.blocker_id in (buyer_id, seller_id))
    )
  );

-- Hide existing conversations from both sides while a block is active.
drop policy if exists "participants view conversations" on public.conversations;
create policy "participants view conversations"
  on public.conversations
  for select to authenticated
  using (
    (buyer_id = auth.uid() or seller_id = auth.uid())
    and not exists (
      select 1
      from public.user_blocks b
      where
        (b.blocker_id = auth.uid() and b.blocked_id in (buyer_id, seller_id))
        or
        (b.blocked_id = auth.uid() and b.blocker_id in (buyer_id, seller_id))
    )
  );

-- Enforce the block at the database boundary, even if a client bypasses the UI.
drop policy if exists "participants send messages" on public.messages;
create policy "participants send messages"
  on public.messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
        and not exists (
          select 1
          from public.user_blocks b
          where
            (b.blocker_id = auth.uid() and b.blocked_id in (c.buyer_id, c.seller_id))
            or
            (b.blocked_id = auth.uid() and b.blocker_id in (c.buyer_id, c.seller_id))
        )
    )
  );

drop policy if exists "participants view messages" on public.messages;
create policy "participants view messages"
  on public.messages
  for select to authenticated
  using (
    exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
        and not exists (
          select 1
          from public.user_blocks b
          where
            (b.blocker_id = auth.uid() and b.blocked_id in (c.buyer_id, c.seller_id))
            or
            (b.blocked_id = auth.uid() and b.blocker_id in (c.buyer_id, c.seller_id))
        )
    )
  );
