-- Revant account deletion request workflow.
-- PENDING: do not move into supabase/migrations or apply until the 29 missing
-- historical migration sources are reconciled. This migration only records a
-- request; it never deletes an Auth user, profile, shop, financial record or file.

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'requested'
    check (status in ('requested', 'blocked', 'approved', 'rejected', 'cancelled', 'completed')),
  blockers text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references auth.users(id) on delete set null
);

comment on table public.account_deletion_requests is
  'Minimal account-deletion request log. No email, phone, password, token, or file URL is stored. Requests do not delete accounts.';

create unique index if not exists account_deletion_requests_one_active_per_user
  on public.account_deletion_requests (user_id)
  where status in ('requested', 'blocked');

create index if not exists account_deletion_requests_status_created_idx
  on public.account_deletion_requests (status, created_at desc);

alter table public.account_deletion_requests enable row level security;
revoke all on table public.account_deletion_requests from public, anon, authenticated;
grant all on table public.account_deletion_requests to service_role;

create or replace function public.request_account_deletion()
returns table (
  request_id uuid,
  request_status text,
  blockers text[]
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_fk record;
  v_has_rows boolean;
  v_blockers text[] := '{}'::text[];
  v_request_id uuid;
  v_status text;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'AUTHENTICATION_REQUIRED';
  end if;

  -- A person with ANY administrative role is never eligible for this customer flow.
  if exists (
    select 1
    from public.user_roles as r
    where r.user_id = v_user_id
      and r.role::text not in ('buyer', 'seller')
  ) then
    raise exception using errcode = '42501', message = 'ADMIN_ACCOUNT_NOT_ELIGIBLE';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text, 0)
  );

  -- Conservatively inspect every restrictive FK into the profile or Auth identity.
  -- This avoids hard-coding today's marketplace tables and missing a future obligation.
  for v_fk in
    select
      source_ns.nspname as source_schema,
      source_table.relname as source_table,
      source_column.attname as source_column
    from pg_catalog.pg_constraint as fk
    join pg_catalog.pg_class as source_table
      on source_table.oid = fk.conrelid
    join pg_catalog.pg_namespace as source_ns
      on source_ns.oid = source_table.relnamespace
    join pg_catalog.pg_class as referenced_table
      on referenced_table.oid = fk.confrelid
    cross join lateral pg_catalog.generate_subscripts(fk.conkey, 1) as key_index(i)
    join pg_catalog.pg_attribute as source_column
      on source_column.attrelid = fk.conrelid
     and source_column.attnum = fk.conkey[key_index.i]
    join pg_catalog.pg_attribute as referenced_column
      on referenced_column.attrelid = fk.confrelid
     and referenced_column.attnum = fk.confkey[key_index.i]
    where fk.contype = 'f'
      and fk.confrelid in (
        'public.profiles'::regclass,
        'auth.users'::regclass
      )
      and referenced_column.attname = 'id'
      and fk.confdeltype in ('a', 'r')
      and source_ns.nspname not in ('pg_catalog', 'information_schema')
      and source_table.relkind in ('r', 'p')
  loop
    execute pg_catalog.format(
      'select exists (select 1 from %I.%I where %I = $1)',
      v_fk.source_schema,
      v_fk.source_table,
      v_fk.source_column
    )
    into v_has_rows
    using v_user_id;

    if v_has_rows then
      if v_fk.source_table = 'shops' then
        if not ('shop_transfer_or_closure' = any(v_blockers)) then
          v_blockers := pg_catalog.array_append(v_blockers, 'shop_transfer_or_closure');
        end if;
      elsif v_fk.source_table in (
        'orders', 'order_items', 'payments', 'refunds', 'disputes',
        'wallets', 'ledger_entries', 'payouts', 'store_subscriptions',
        'delivery_companies', 'deliveries'
      ) then
        if not ('financial_or_order_obligations' = any(v_blockers)) then
          v_blockers := pg_catalog.array_append(v_blockers, 'financial_or_order_obligations');
        end if;
      elsif v_fk.source_table ilike '%kyc%'
         or v_fk.source_table ilike '%document%'
         or v_fk.source_table ilike '%identity%' then
        if not ('legal_or_identity_records' = any(v_blockers)) then
          v_blockers := pg_catalog.array_append(v_blockers, 'legal_or_identity_records');
        end if;
      elsif v_fk.source_table ilike '%message%'
         or v_fk.source_table ilike '%conversation%'
         or v_fk.source_table ilike '%support%'
         or v_fk.source_table ilike '%report%'
         or v_fk.source_table ilike '%review%'
         or v_fk.source_table ilike '%audit%' then
        if not ('communication_or_moderation_history' = any(v_blockers)) then
          v_blockers := pg_catalog.array_append(v_blockers, 'communication_or_moderation_history');
        end if;
      else
        if not ('related_records_need_review' = any(v_blockers)) then
          v_blockers := pg_catalog.array_append(v_blockers, 'related_records_need_review');
        end if;
      end if;
    end if;
  end loop;

  -- Storage objects must be removed through the Storage API before Auth deletion.
  if exists (
    select 1
    from storage.objects as object
    where object.owner = v_user_id
  ) then
    v_blockers := pg_catalog.array_append(v_blockers, 'storage_cleanup_required');
  end if;

  if pg_catalog.cardinality(v_blockers) > 0 then
    v_status := 'blocked';
  else
    v_status := 'requested';
  end if;

  insert into public.account_deletion_requests as current_request (
    user_id, status, blockers, created_at, updated_at, last_requested_at
  )
  values (
    v_user_id, v_status, v_blockers, now(), now(), now()
  )
  on conflict (user_id) where status in ('requested', 'blocked')
  do update set
    status = excluded.status,
    blockers = excluded.blockers,
    updated_at = now(),
    last_requested_at = now()
  returning current_request.id, current_request.status, current_request.blockers
  into v_request_id, v_status, v_blockers;

  return query select v_request_id, v_status, v_blockers;
end;
$function$;

create or replace function public.get_my_account_deletion_request()
returns table (
  request_id uuid,
  request_status text,
  blockers text[],
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = ''
as $function$
  select
    request.id,
    request.status,
    request.blockers,
    request.created_at,
    request.updated_at
  from public.account_deletion_requests as request
  where request.user_id = auth.uid()
  order by request.created_at desc
  limit 1;
$function$;

create or replace function public.cancel_my_account_deletion_request()
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_updated integer;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'AUTHENTICATION_REQUIRED';
  end if;

  update public.account_deletion_requests
  set status = 'cancelled',
      updated_at = now()
  where user_id = auth.uid()
    and status in ('requested', 'blocked');

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$function$;

revoke all on function public.request_account_deletion() from public, anon;
revoke all on function public.get_my_account_deletion_request() from public, anon;
revoke all on function public.cancel_my_account_deletion_request() from public, anon;
grant execute on function public.request_account_deletion() to authenticated;
grant execute on function public.get_my_account_deletion_request() to authenticated;
grant execute on function public.cancel_my_account_deletion_request() to authenticated;
