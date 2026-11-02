-- The KYC rows were ordered by created_at in the outer aggregate,
-- but the inner projection omitted that column. Include it so the
-- super-admin operations snapshot can be assembled without SQL errors.
create or replace function private.admin_operations_snapshot()
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'private'
as $function$
declare
  result jsonb;
begin
  if auth.uid() is null or not public.has_any_admin_role() then
    raise exception 'forbidden';
  end if;

  select jsonb_build_object(
    'users', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (
      select p.id,p.display_name,p.phone,p.country_code,p.city,p.is_suspended,p.created_at,
        coalesce((select jsonb_agg(ur.role::text) from public.user_roles ur where ur.user_id=p.id),'[]'::jsonb) roles
      from public.profiles p order by p.created_at desc limit 25
    ) x),'[]'::jsonb),
    'orders', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (
      select o.id,o.order_number,o.status::text status,o.total_amount,o.currency,o.created_at
      from public.orders o order by o.created_at desc limit 25
    ) x),'[]'::jsonb),
    'kyc', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (
      select k.id,k.user_id,k.status::text status,k.legal_name,k.document_type,k.document_country,k.submitted_at,k.reviewed_at,k.created_at
      from public.kyc_profiles k where k.status::text in ('pending','under_review')
      order by k.created_at desc limit 25
    ) x),'[]'::jsonb),
    'disputes', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (
      select d.id,d.order_id,d.opened_by,d.reason,d.description,d.status::text status,d.assigned_to,d.created_at
      from public.disputes d where d.status::text in ('open','under_review')
      order by d.created_at desc limit 25
    ) x),'[]'::jsonb),
    'reports', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (
      select r.id,r.reporter_id,r.target_type,r.target_id,r.reason,r.status::text status,r.assigned_to,r.created_at
      from public.reports r where r.status::text in ('open','under_review')
      order by r.created_at desc limit 25
    ) x),'[]'::jsonb),
    'audit', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (
      select a.id,a.actor_id,a.action::text action,a.entity_type,a.entity_id,a.description,a.created_at
      from public.audit_logs a order by a.created_at desc limit 40
    ) x),'[]'::jsonb)
  ) into result;
  return result;
end;
$function$;
