-- Consolidate support visibility rules into one SELECT policy per table
-- and index both new support event actors and the bootstrap claim FK.
drop policy if exists "support staff view tickets" on public.support_tickets;
drop policy if exists "users view own tickets" on public.support_tickets;

create policy "owners and support staff view tickets"
  on public.support_tickets for select to authenticated
  using (
    user_id = (select auth.uid())
    or (
      public.current_user_has_permission('support.manage')
      and (
        public.current_user_has_permission('users.manage')
        or assigned_to is null
        or assigned_to = (select auth.uid())
      )
    )
  );

drop policy if exists "support staff view messages" on public.support_messages;
drop policy if exists "ticket users view messages" on public.support_messages;

create policy "owners and support staff view messages"
  on public.support_messages for select to authenticated
  using (
    exists (
      select 1
      from public.support_tickets t
      where t.id = support_messages.ticket_id
        and t.user_id = (select auth.uid())
    )
    or (
      public.current_user_has_permission('support.manage')
      and exists (
        select 1
        from public.support_tickets t
        where t.id = support_messages.ticket_id
          and (
            public.current_user_has_permission('users.manage')
            or t.assigned_to is null
            or t.assigned_to = (select auth.uid())
          )
      )
    )
  );

create index if not exists support_ticket_events_actor_id_idx
  on public.support_ticket_events(actor_id);

create index if not exists super_admin_bootstrap_claims_user_id_idx
  on public.super_admin_bootstrap_claims(user_id);
