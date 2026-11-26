-- Integration checks run only against the disposable CI PostgreSQL service.
BEGIN;
INSERT INTO auth.users(id) VALUES
 ('10000000-0000-0000-0000-000000000001'),
 ('10000000-0000-0000-0000-000000000002'),
 ('40000000-0000-0000-0000-000000000001');
INSERT INTO public.profiles(id) VALUES
 ('10000000-0000-0000-0000-000000000001'),
 ('10000000-0000-0000-0000-000000000002'),
 ('40000000-0000-0000-0000-000000000001');
INSERT INTO public.shops(id,owner_id,slug,name,city,phone,status) VALUES
 ('10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','boutique-test','Boutique test','Niamey','+22790000001','active'),
 ('10000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','autre-boutique','Autre boutique','Niamey','+22790000002','active');
INSERT INTO public.products(id,shop_id,name,slug,base_price,currency,stock_quantity,status,product_type,size_stock) VALUES
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','T-shirt test','t-shirt-test',5000,'XOF',20,'active','clothing','{"M":3,"L":2}'),
 ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','Sac test','sac-test',2500,'XOF',5,'active','other','{}'),
 ('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002','Produit autre boutique','produit-autre-boutique',1000,'XOF',5,'active','other','{}'),
 ('20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000001','T-shirt stock agrégé','t-shirt-stock-agrege',1000,'XOF',3,'active','clothing','{"M":10,"L":10}');
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
SET LOCAL ROLE service_role;
DO $$
DECLARE v_first jsonb; v_retry jsonb; v_confirmation jsonb; v_count integer; v_buyer_order jsonb;
BEGIN
 v_first := public.create_guest_order_batch(
  '[
   {"product_id":"20000000-0000-0000-0000-000000000001","quantity":2,"variant_label":"M"},
   {"product_id":"20000000-0000-0000-0000-000000000001","quantity":1,"variant_label":"L"},
   {"product_id":"20000000-0000-0000-0000-000000000002","quantity":2,"variant_label":null}
  ]'::jsonb,'Client Test','+22790000000','Niamey','Quartier test, rue 1',
  repeat('a',64),'','30000000-0000-0000-0000-000000000001',NULL);
 SELECT count(*) INTO v_count FROM public.order_items WHERE order_id=(v_first->>'order_id')::uuid;
 IF v_count<>3 THEN RAISE EXCEPTION 'expected 3 lines, got %',v_count; END IF;
 IF (SELECT total_amount FROM public.orders WHERE id=(v_first->>'order_id')::uuid)<>20000 THEN
  RAISE EXCEPTION 'incorrect order total'; END IF;
 v_retry := public.create_guest_order_batch(
  '[
   {"product_id":"20000000-0000-0000-0000-000000000001","quantity":2,"variant_label":"M"},
   {"product_id":"20000000-0000-0000-0000-000000000001","quantity":1,"variant_label":"L"},
   {"product_id":"20000000-0000-0000-0000-000000000002","quantity":2,"variant_label":null}
  ]'::jsonb,'Client Test','+22790000000','Niamey','Quartier test, rue 1',
  repeat('a',64),'','30000000-0000-0000-0000-000000000001',NULL);
 IF v_retry->>'order_id'<>v_first->>'order_id' THEN RAISE EXCEPTION 'retry returned a different order'; END IF;
 SELECT count(*) INTO v_count FROM public.orders WHERE idempotency_key='30000000-0000-0000-0000-000000000001';
 IF v_count<>1 THEN RAISE EXCEPTION 'idempotent retry created a duplicate'; END IF;
 v_confirmation := private.get_guest_order_impl(v_first->>'order_number',repeat('a',64));
 IF jsonb_array_length(v_confirmation->'items')<>3 THEN RAISE EXCEPTION 'confirmation omitted order lines'; END IF;
 IF v_confirmation->'items'->0->>'product_name'<>'T-shirt test'
    OR v_confirmation->'items'->0->>'variant_label'<>'L'
    OR v_confirmation->'items'->1->>'variant_label'<>'M'
    OR v_confirmation->'items'->2->>'product_name'<>'Sac test' THEN
  RAISE EXCEPTION 'confirmation item order is not deterministic';
 END IF;
 BEGIN
  PERFORM public.create_guest_order_batch('[{"product_id":"20000000-0000-0000-0000-000000000002","quantity":1}]'::jsonb,
   'Client Test','+22790000000','Niamey','Quartier test, rue 1',repeat('a',64),'',
   '30000000-0000-0000-0000-000000000001',NULL);
  RAISE EXCEPTION 'expected idempotency_conflict';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'idempotency_conflict' THEN RAISE; END IF; END;
 BEGIN
  PERFORM public.create_guest_order_batch('[
   {"product_id":"20000000-0000-0000-0000-000000000002","quantity":1},
   {"product_id":"20000000-0000-0000-0000-000000000003","quantity":1}
  ]'::jsonb,'Client Test','+22790000000','Niamey','Quartier test, rue 1',repeat('b',64),'',
   '30000000-0000-0000-0000-000000000002',NULL);
  RAISE EXCEPTION 'expected mixed_shop_order';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'mixed_shop_order' THEN RAISE; END IF; END;
 BEGIN
  PERFORM public.create_guest_order_batch('[{"product_id":"20000000-0000-0000-0000-000000000001","quantity":1}]'::jsonb,
   'Client Test','+22790000000','Niamey','Quartier test, rue 1',repeat('c',64),'',
   '30000000-0000-0000-0000-000000000003',NULL);
  RAISE EXCEPTION 'expected variant_required';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'variant_required' THEN RAISE; END IF; END;
 BEGIN
  PERFORM public.create_guest_order_batch('[{"product_id":"20000000-0000-0000-0000-000000000001","quantity":4,"variant_label":"M"}]'::jsonb,
   'Client Test','+22790000000','Niamey','Quartier test, rue 1',repeat('d',64),'',
   '30000000-0000-0000-0000-000000000004',NULL);
  RAISE EXCEPTION 'expected variant stock rejection';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'product_variant_unavailable_or_insufficient_stock' THEN RAISE; END IF; END;
 BEGIN
  PERFORM public.create_guest_order_batch('[
   {"product_id":"20000000-0000-0000-0000-000000000004","quantity":2,"variant_label":"M"},
   {"product_id":"20000000-0000-0000-0000-000000000004","quantity":2,"variant_label":"L"}
  ]'::jsonb,'Client Test','+22790000000','Niamey','Quartier test, rue 1',repeat('f',64),'',
   '30000000-0000-0000-0000-000000000006',NULL);
  RAISE EXCEPTION 'expected aggregate product stock rejection';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'product unavailable' THEN RAISE; END IF; END;
 BEGIN
  PERFORM public.create_guest_order_batch('{"not":"an array"}'::jsonb,'Client Test','+22790000000',
   'Niamey','Quartier test, rue 1',repeat('1',64),'','30000000-0000-0000-0000-000000000007',NULL);
  RAISE EXCEPTION 'expected invalid request for non-array cart';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'invalid request' THEN RAISE; END IF; END;
 v_buyer_order := public.create_guest_order_batch(
  '[{"product_id":"20000000-0000-0000-0000-000000000002","quantity":1}]'::jsonb,
  'Acheteur test','+22791111111','Niamey','Quartier acheteur, rue 2',
  repeat('e',64),'','30000000-0000-0000-0000-000000000008',
  '40000000-0000-0000-0000-000000000001');
 IF (SELECT buyer_id FROM public.orders WHERE id=(v_buyer_order->>'order_id')::uuid)
    <> '40000000-0000-0000-0000-000000000001'::uuid THEN
  RAISE EXCEPTION 'authenticated buyer id was not persisted';
 END IF;
 BEGIN
  PERFORM public.create_guest_order_batch(
   '[{"product_id":"20000000-0000-0000-0000-000000000002","quantity":1}]'::jsonb,
   'Vendeur test','+22792222222','Niamey','Quartier vendeur, rue 3',
   repeat('9',64),'','30000000-0000-0000-0000-000000000009',
   '10000000-0000-0000-0000-000000000001');
  RAISE EXCEPTION 'expected own-product rejection';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'cannot order own product' THEN RAISE; END IF; END;
END $$;
RESET ROLE;
DO $$
BEGIN
 IF has_function_privilege('anon','public.create_guest_order_batch(jsonb,text,text,text,text,text,text,uuid,uuid)','EXECUTE')
 OR has_function_privilege('authenticated','public.create_guest_order_batch(jsonb,text,text,text,text,text,text,uuid,uuid)','EXECUTE') THEN
  RAISE EXCEPTION 'public roles have EXECUTE on privileged checkout RPC';
 END IF;
END $$;
ROLLBACK;
