-- Isolated PostgreSQL integration tests for immutable order commission snapshots.
BEGIN;

INSERT INTO auth.users(id) VALUES
 ('51000000-0000-4000-8000-000000000001'),
 ('51000000-0000-4000-8000-000000000002');
INSERT INTO public.profiles(id) VALUES
 ('51000000-0000-4000-8000-000000000001'),
 ('51000000-0000-4000-8000-000000000002');

INSERT INTO public.shops(id,owner_id,slug,name,city,phone,status)
VALUES (
 '52000000-0000-4000-8000-000000000001',
 '51000000-0000-4000-8000-000000000002',
 'commission-test-shop','Commission Test Shop','Niamey','+22790000001','active'
);

INSERT INTO public.products(id,shop_id,name,slug,base_price,currency,stock_quantity,status)
VALUES (
 '53000000-0000-4000-8000-000000000001',
 '52000000-0000-4000-8000-000000000001',
 'Commission test product','commission-test-product',1000,'XOF',10,'active'
);

DO $$
DECLARE
  v_order_one uuid := '54000000-0000-4000-8000-000000000001';
  v_order_two uuid := '54000000-0000-4000-8000-000000000002';
  v_rate numeric;
  v_balance numeric;
  v_metadata jsonb;
BEGIN
  INSERT INTO public.orders(id,buyer_id,order_number,status,subtotal,delivery_fee,total_amount,currency)
  VALUES (v_order_one,'51000000-0000-4000-8000-000000000001','COMMISSION-ONE','delivered',1000,0,1000,'XOF');

  SELECT commission_rate INTO v_rate FROM public.orders WHERE id=v_order_one;
  IF v_rate <> 0.5000 THEN
    RAISE EXCEPTION 'first order did not capture the configured 0.5%% rate; got %',v_rate;
  END IF;

  UPDATE public.system_settings SET value='2.0'::jsonb WHERE key='revant.commission_percent';

  INSERT INTO public.orders(id,buyer_id,order_number,status,subtotal,delivery_fee,total_amount,currency)
  VALUES (v_order_two,'51000000-0000-4000-8000-000000000001','COMMISSION-TWO','pending',1000,0,1000,'XOF');

  SELECT commission_rate INTO v_rate FROM public.orders WHERE id=v_order_two;
  IF v_rate <> 2.0000 THEN
    RAISE EXCEPTION 'second order did not capture updated 2%% rate; got %',v_rate;
  END IF;

  INSERT INTO public.order_items(order_id,product_id,shop_id,product_name,quantity,unit_price,line_total,currency)
  VALUES (v_order_one,'53000000-0000-4000-8000-000000000001','52000000-0000-4000-8000-000000000001',
    'Commission test product',1,1000,1000,'XOF');

  INSERT INTO public.payments(order_id,status,paid_at)
  VALUES (v_order_one,'paid',now());

  -- Even after the global rate changes to 2%, releasing the first order
  -- must use the immutable 0.5% snapshot captured at order creation.
  PERFORM private.release_order_finance(v_order_one);

  SELECT pending_balance INTO v_balance
  FROM public.wallets
  WHERE user_id='51000000-0000-4000-8000-000000000002';

  IF v_balance <> 995.00 THEN
    RAISE EXCEPTION 'seller pending balance must reflect the original 0.5%% rate; got %',v_balance;
  END IF;

  SELECT metadata INTO v_metadata
  FROM public.ledger_entries
  WHERE order_id=v_order_one;

  IF v_metadata->>'commission_rate' <> '0.5000' THEN
    RAISE EXCEPTION 'ledger metadata did not preserve the order commission snapshot: %',v_metadata;
  END IF;

  BEGIN
    UPDATE public.orders SET commission_rate=3.0000 WHERE id=v_order_one;
    RAISE EXCEPTION 'commission snapshot must be immutable';
  EXCEPTION WHEN SQLSTATE '42501' THEN
    NULL;
  END;
END;
$$;

ROLLBACK;
