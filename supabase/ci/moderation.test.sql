\set ON_ERROR_STOP on

insert into public.shops(id, status) values
  ('10000000-0000-4000-8000-000000000001', 'active'),
  ('10000000-0000-4000-8000-000000000002', 'draft'),
  ('10000000-0000-4000-8000-000000000003', 'pending'),
  ('10000000-0000-4000-8000-000000000004', 'suspended');

insert into public.products(id, shop_id, status) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'pending'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'pending'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'active');

set role authenticated;
set request.jwt.claim.sub = '30000000-0000-4000-8000-000000000001';
set request.jwt.claims = '{"role":"authenticated","aal":"aal2"}';
set test.permission = 'products.manage';

do $$
begin
  begin
    update public.products set status = 'active'
    where id = '20000000-0000-4000-8000-000000000001';
    raise exception 'pending product must not be self-published';
  exception when sqlstate '42501' then null;
  end;

  begin
    insert into public.products(id, shop_id, status)
    values ('20000000-0000-4000-8000-000000000004',
      '10000000-0000-4000-8000-000000000002', 'active');
    raise exception 'product must not be activated in a draft shop';
  exception when sqlstate '42501' then null;
  end;
end;
$$;

-- Sellers retain only the ordinary active <-> archived controls.
update public.products set status = 'archived'
where id = '20000000-0000-4000-8000-000000000003';
update public.products set status = 'active'
where id = '20000000-0000-4000-8000-000000000003';

-- A user with view-only permission cannot moderate products.
set test.permission = 'products.view';
do $$
begin
  begin
    perform public.admin_moderate_product(
      '20000000-0000-4000-8000-000000000001', 'active', null
    );
    raise exception 'view-only role must not moderate products';
  exception when others then
    if sqlerrm = 'view-only role must not moderate products' then raise; end if;
  end;
end;
$$;
set test.permission = 'products.manage';

set test.permission = 'shops.manage';

-- Shop decisions follow the same audited server-side moderation path.
select public.admin_moderate_shop(
  '10000000-0000-4000-8000-000000000003', 'active', 'Dossier boutique contrôlé'
);

do $$
begin
  if (select status from public.shops where id = '10000000-0000-4000-8000-000000000003') <> 'active' then
    raise exception 'admin shop approval did not activate shop';
  end if;
  if (select count(*) from public.admin_actions where target_id = '10000000-0000-4000-8000-000000000003' and action = 'approve_shop') <> 1 then
    raise exception 'shop approval admin action was not recorded';
  end if;
  if (select count(*) from public.audit_logs where entity_id = '10000000-0000-4000-8000-000000000003' and action = 'approve') <> 1 then
    raise exception 'shop approval audit log was not recorded';
  end if;

  begin
    perform public.admin_moderate_shop(
      '10000000-0000-4000-8000-000000000002', 'active', null
    );
    raise exception 'draft shop must not be approved';
  exception when others then
    if sqlerrm = 'draft shop must not be approved' then raise; end if;
  end;
end;
$$;

select public.admin_moderate_shop(
  '10000000-0000-4000-8000-000000000003', 'suspended', 'Contrôle administratif'
);
select public.admin_moderate_shop(
  '10000000-0000-4000-8000-000000000003', 'active', 'Réactivation après contrôle'
);

do $$
begin
  if (select count(*) from public.admin_actions where target_id = '10000000-0000-4000-8000-000000000003' and action = 'suspend_shop') <> 1 then
    raise exception 'shop suspension admin action was not recorded';
  end if;
  if (select count(*) from public.admin_actions where target_id = '10000000-0000-4000-8000-000000000003' and action = 'reactivate_shop') <> 1 then
    raise exception 'shop reactivation admin action was not recorded';
  end if;
  if (select status from public.shops where id = '10000000-0000-4000-8000-000000000003') <> 'active' then
    raise exception 'shop reactivation did not restore active status';
  end if;
  if (select count(*) from public.audit_logs where entity_id = '10000000-0000-4000-8000-000000000003' and action = 'update') <> 2 then
    raise exception 'shop suspension/reactivation audit logs were not recorded';
  end if;
end;
$$;

set test.permission = 'products.manage';

-- Admin approval is transactional, permission-gated, and requires an active shop.
select public.admin_moderate_product(
  '20000000-0000-4000-8000-000000000001', 'active', 'Contrôle du catalogue effectué'
);

do $$
begin
  if (select status from public.products where id = '20000000-0000-4000-8000-000000000001') <> 'active' then
    raise exception 'admin approval did not activate product';
  end if;
  if (select count(*) from public.admin_actions where target_id = '20000000-0000-4000-8000-000000000001' and action = 'approve_product') <> 1 then
    raise exception 'admin action was not recorded';
  end if;
  if (select count(*) from public.audit_logs where entity_id = '20000000-0000-4000-8000-000000000001' and action = 'approve') <> 1 then
    raise exception 'audit log was not recorded';
  end if;

  begin
    perform public.admin_moderate_product(
      '20000000-0000-4000-8000-000000000001', 'active', null
    );
    raise exception 'already approved product must not be moderated twice';
  exception when others then
    if sqlerrm = 'already approved product must not be moderated twice' then raise; end if;
  end;

  begin
    perform public.admin_moderate_product(
      '20000000-0000-4000-8000-000000000002', 'active', null
    );
    raise exception 'product in draft shop must not be approved';
  exception when others then
    if sqlerrm = 'product in draft shop must not be approved' then raise; end if;
  end;

  begin
    perform public.admin_moderate_product(
      '20000000-0000-4000-8000-000000000002', 'rejected', '   '
    );
    raise exception 'rejection without a reason must fail';
  exception when others then
    if sqlerrm = 'rejection without a reason must fail' then raise; end if;
  end;
end;
$$;

select public.admin_moderate_product(
  '20000000-0000-4000-8000-000000000002', 'rejected', 'Photos et description insuffisantes'
);

do $$
begin
  if (select status from public.products where id = '20000000-0000-4000-8000-000000000002') <> 'rejected' then
    raise exception 'admin rejection did not reject product';
  end if;
  if (select count(*) from public.admin_actions where target_id = '20000000-0000-4000-8000-000000000002' and action = 'reject_product') <> 1 then
    raise exception 'rejection admin action was not recorded';
  end if;
  if (select count(*) from public.audit_logs where entity_id = '20000000-0000-4000-8000-000000000002' and action = 'reject') <> 1 then
    raise exception 'rejection audit log was not recorded';
  end if;

  begin
    update public.products set status = 'active'
    where id = '20000000-0000-4000-8000-000000000002';
    raise exception 'seller must not reactivate a rejected product';
  exception when sqlstate '42501' then null;
  end;
end;
$$;



-- Editing approved commercial content must return the product to moderation.
update public.products
set name = 'Nom commercial modifié'
where id = '20000000-0000-4000-8000-000000000001';

do $$
begin
  if (select status from public.products where id = '20000000-0000-4000-8000-000000000001') <> 'pending' then
    raise exception 'approved product content edit must return product to pending';
  end if;
  if (select count(*) from public.audit_logs where entity_id = '20000000-0000-4000-8000-000000000001' and description = 'Product content changed; moderation is required before publication') <> 1 then
    raise exception 'product re-moderation audit entry missing';
  end if;
  begin
    update public.products set status = 'active'
    where id = '20000000-0000-4000-8000-000000000001';
    raise exception 'seller must not self-approve edited product';
  exception when sqlstate '42501' then null;
  end;
end;
$$;

-- An image change is also catalog content and must trigger re-moderation.
select public.admin_moderate_product(
  '20000000-0000-4000-8000-000000000001', 'active', 'Nouvelle approbation après modification'
);
insert into public.product_images(product_id, image_url, sort_order)
values ('20000000-0000-4000-8000-000000000001', 'https://example.test/product-a.jpg', 0);

do $$
begin
  if (select status from public.products where id = '20000000-0000-4000-8000-000000000001') <> 'pending' then
    raise exception 'adding an image to an approved product must return it to pending';
  end if;
end;
$$;

select public.admin_moderate_product(
  '20000000-0000-4000-8000-000000000001', 'active', 'Approbation après ajout de photo'
);
update public.product_images
set image_url = 'https://example.test/product-a-updated.jpg'
where product_id = '20000000-0000-4000-8000-000000000001';

do $$
begin
  if (select status from public.products where id = '20000000-0000-4000-8000-000000000001') <> 'pending' then
    raise exception 'updating an image must return product to pending';
  end if;
end;
$$;

reset role;


-- An archived product with modified content/photos cannot be republished directly.
select public.admin_moderate_product(
  '20000000-0000-4000-8000-000000000001', 'active', 'Approbation avant archivage'
);
update public.products set status = 'archived'
where id = '20000000-0000-4000-8000-000000000001';
update public.product_images
set image_url = 'https://example.test/product-a-archived-edit.jpg'
where product_id = '20000000-0000-4000-8000-000000000001';

do $debug$
begin
  if (select status from public.products where id = '20000000-0000-4000-8000-000000000001') <> 'archived' then
    raise exception 'photo change must not republish an archived product';
  end if;
  if (select moderation_required from public.products where id = '20000000-0000-4000-8000-000000000001') is not true then
    raise exception 'archived product must retain moderation_required flag after photo change';
  end if;
  raise notice 'Before seller reactivation: status=%, moderation_required=%',
    (select status from public.products where id = '20000000-0000-4000-8000-000000000001'),
    (select moderation_required from public.products where id = '20000000-0000-4000-8000-000000000001');
end;
$debug$;

update public.products set status = 'active'
where id = '20000000-0000-4000-8000-000000000001';

do $debug$
begin
  raise notice 'After seller reactivation: status=%, moderation_required=%',
    (select status from public.products where id = '20000000-0000-4000-8000-000000000001'),
    (select moderation_required from public.products where id = '20000000-0000-4000-8000-000000000001');
  if (select status from public.products where id = '20000000-0000-4000-8000-000000000001') <> 'pending' then
    raise exception 'archived edited product must return to pending instead of self-publishing';
  end if;
end;
$debug$;

select public.admin_moderate_product(
  '20000000-0000-4000-8000-000000000001', 'active', 'Approbation après revue des modifications'
);

do $debug$
begin
  if (select moderation_required from public.products where id = '20000000-0000-4000-8000-000000000001') is not false then
    raise exception 'admin approval must clear moderation_required';
  end if;
end;
$debug$;

reset role;
