\set ON_ERROR_STOP on
begin; set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated","trusted":"false"}',true);
do $block$ begin
 if exists(select 1 from public.role_permissions rp join public.permissions p on p.id=rp.permission_id where rp.role='admin' and p.key='settings.manage') then raise exception 'admin still has settings.manage'; end if;
 begin perform public.admin_set_setting('revant.commission_percent','1.5'::jsonb,'00000000-0000-4000-8000-000000000002'); raise exception 'admin unexpectedly changed commission';
 exception when others then if sqlerrm='admin unexpectedly changed commission' then raise; end if; if sqlerrm not in ('actor_mismatch','forbidden') then raise; end if; end;
end $block$; reset role; commit;
begin; set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated","trusted":"false"}',true);
do $block$ begin begin perform public.admin_set_setting('revant.commission_percent','1.5'::jsonb,'00000000-0000-4000-8000-000000000001'); raise exception 'untrusted Super Admin unexpectedly changed commission'; exception when others then if sqlerrm='untrusted Super Admin unexpectedly changed commission' then raise; end if; if sqlerrm<>'forbidden' then raise; end if; end; end $block$;
reset role; commit;
begin; set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated","trusted":"true"}',true);
select public.admin_set_setting('revant.commission_percent','1.5'::jsonb,'00000000-0000-4000-8000-000000000001'); reset role;
do $block$ begin
 if (select value from public.system_settings where key='revant.commission_percent')<>'1.5'::jsonb then raise exception 'commission value not saved'; end if;
 if not exists(select 1 from public.audit_logs where entity_type='system_settings' and metadata->>'key'='revant.commission_percent' and metadata->>'old'='0.5' and metadata->>'new'='1.5') then raise exception 'commission audit missing'; end if;
end $block$; commit;
select 'admin settings permission guardrail tests passed' as result;