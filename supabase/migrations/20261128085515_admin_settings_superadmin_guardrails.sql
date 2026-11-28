delete from public.role_permissions rp
using public.permissions p
where rp.permission_id=p.id and rp.role='admin' and p.key='settings.manage';

insert into public.audit_logs(actor_id,action,entity_type,description,metadata)
values(null,'permission_change'::public.audit_action,'role_permissions',
'Global settings management restricted to Super Admin',
jsonb_build_object('role','admin','permission','settings.manage','enabled',false));

create or replace function private.admin_set_setting(p_key text,p_value jsonb)
returns void language plpgsql security definer set search_path to ''
as $function$
declare v_type text; v_old jsonb; v_actor uuid:=auth.uid();
begin
 if v_actor is null
 or not exists(select 1 from public.user_roles where user_id=v_actor and role='super_admin'::public.user_role)
 or not public.current_user_has_permission('settings.manage')
 or not private.is_current_super_admin_device_trusted() then raise exception 'forbidden'; end if;
 select value_type::text,value into v_type,v_old from public.system_settings where key=p_key for update;
 if not found then raise exception 'Paramètre inconnu : %',p_key; end if;
 if v_type='number' and jsonb_typeof(p_value)<>'number' then raise exception 'Valeur numérique attendue'; end if;
 if v_type='boolean' and jsonb_typeof(p_value)<>'boolean' then raise exception 'Valeur booléenne attendue'; end if;
 if v_type='string' and jsonb_typeof(p_value)<>'string' then raise exception 'Texte attendu'; end if;
 if p_key='revant.commission_percent' and ((p_value)::numeric<0 or (p_value)::numeric>100) then raise exception 'La commission doit être comprise entre 0 et 100 %%'; end if;
 update public.system_settings set value=p_value,updated_by=v_actor,updated_at=now() where key=p_key;
 insert into public.audit_logs(actor_id,action,entity_type,description,metadata)
 values(v_actor,'config_change','system_settings','Modification du paramètre '||p_key,jsonb_build_object('key',p_key,'old',v_old,'new',p_value));
end;
$function$;