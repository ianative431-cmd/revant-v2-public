\set ON_ERROR_STOP on
create role anon nologin; create role authenticated nologin; create role service_role nologin;
create schema auth; create schema private;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb) $$;
create type public.user_role as enum ('super_admin','admin');
create type public.audit_action as enum ('config_change','permission_change');
create table public.permissions(id uuid primary key,key text not null unique);
create table public.user_roles(user_id uuid not null,role public.user_role not null,primary key(user_id,role));
create table public.role_permissions(role public.user_role not null,permission_id uuid not null references public.permissions(id),primary key(role,permission_id));
create table public.system_settings(key text primary key,value jsonb not null,value_type text not null,updated_by uuid,updated_at timestamptz not null default now());
create table public.audit_logs(id uuid primary key default gen_random_uuid(),actor_id uuid,action public.audit_action not null,entity_type text not null,entity_id uuid,description text not null,metadata jsonb not null default '{}'::jsonb,created_at timestamptz not null default now());
insert into public.permissions values('30000000-0000-4000-8000-000000000001','settings.manage');
insert into public.user_roles values('00000000-0000-4000-8000-000000000001','super_admin'),('00000000-0000-4000-8000-000000000002','admin');
insert into public.role_permissions values('super_admin','30000000-0000-4000-8000-000000000001'),('admin','30000000-0000-4000-8000-000000000001');
insert into public.system_settings values('revant.commission_percent','0.5'::jsonb,'number',null,now());
create function private.is_current_super_admin_device_trusted() returns boolean language sql stable security definer set search_path to '' as $$ select coalesce((select auth.jwt()->>'trusted')='true',false) $$;
create function public.current_user_has_permission(p_permission_key text) returns boolean language sql stable security invoker set search_path to '' as $$
 select exists(select 1 from public.user_roles ur join public.role_permissions rp on rp.role=ur.role join public.permissions p on p.id=rp.permission_id where ur.user_id=(select auth.uid()) and p.key=p_permission_key)
 and (not exists(select 1 from public.user_roles ur where ur.user_id=(select auth.uid()) and ur.role='super_admin') or private.is_current_super_admin_device_trusted())
$$;
create function public.admin_set_setting(p_key text,p_value jsonb,p_actor uuid) returns void language plpgsql security invoker set search_path to '' as $$ begin if p_actor is distinct from (select auth.uid()) then raise exception 'actor_mismatch'; end if; perform private.admin_set_setting(p_key,p_value); end $$;
grant usage on schema auth,private to authenticated,service_role;
grant execute on function auth.uid(),auth.jwt(),private.is_current_super_admin_device_trusted(),public.current_user_has_permission(text),public.admin_set_setting(text,jsonb,uuid) to authenticated,service_role;
grant select on public.permissions,public.user_roles,public.role_permissions to authenticated;
grant select,update on public.system_settings to service_role;
grant select,insert on public.audit_logs to service_role;