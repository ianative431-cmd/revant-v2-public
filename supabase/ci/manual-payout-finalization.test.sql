-- Manual payout finalization tests: only approved/processing payouts can be settled.
BEGIN;

INSERT INTO auth.users(id) VALUES
 ('61000000-0000-4000-8000-000000000001'),
 ('61000000-0000-4000-8000-000000000002'),
 ('61000000-0000-4000-8000-000000000003');
INSERT INTO public.profiles(id) VALUES
 ('61000000-0000-4000-8000-000000000001'),
 ('61000000-0000-4000-8000-000000000002'),
 ('61000000-0000-4000-8000-000000000003');
INSERT INTO public.user_roles(user_id,role)
VALUES ('61000000-0000-4000-8000-000000000001','finance_admin');

INSERT INTO public.wallets(id,user_id,currency,available_balance,pending_balance,status)
VALUES
 ('62000000-0000-4000-8000-000000000001','61000000-0000-4000-8000-000000000002','XOF',500,0,'active'),
 ('62000000-0000-4000-8000-000000000002','61000000-0000-4000-8000-000000000003','XOF',500,0,'active');

INSERT INTO public.payouts(id,wallet_id,seller_id,amount,currency,status,destination_type,destination_reference)
VALUES
 ('63000000-0000-4000-8000-000000000001','62000000-0000-4000-8000-000000000001','61000000-0000-4000-8000-000000000002',200,'XOF','approved','mobile_money','+22790000001'),
 ('63000000-0000-4000-8000-000000000002','62000000-0000-4000-8000-000000000002','61000000-0000-4000-8000-000000000003',200,'XOF','processing','mobile_money','+22790000002');

SET ROLE authenticated;
SET request.jwt.claim.sub = '61000000-0000-4000-8000-000000000001';
SET request.jwt.claims = '{"role":"authenticated","aal":"aal2","sub":"61000000-0000-4000-8000-000000000001"}';

SELECT public.admin_finalize_payout(
 '63000000-0000-4000-8000-000000000001','paid','BANK-TRANSFER-REVANT-001',NULL
);
SELECT public.admin_finalize_payout(
 '63000000-0000-4000-8000-000000000002','failed',NULL,'Transfert externe rejeté par le prestataire'
);

DO $$
BEGIN
  IF (SELECT status FROM public.payouts WHERE id='63000000-0000-4000-8000-000000000001') <> 'paid' THEN
    RAISE EXCEPTION 'manual transfer confirmation did not mark payout paid';
  END IF;
  IF (SELECT provider FROM public.payouts WHERE id='63000000-0000-4000-8000-000000000001') <> 'manual' THEN
    RAISE EXCEPTION 'manual transfer provider was not recorded';
  END IF;
  IF (SELECT provider_payout_id FROM public.payouts WHERE id='63000000-0000-4000-8000-000000000001') <> 'BANK-TRANSFER-REVANT-001' THEN
    RAISE EXCEPTION 'manual transfer reference was not recorded';
  END IF;
  IF (SELECT paid_at FROM public.payouts WHERE id='63000000-0000-4000-8000-000000000001') IS NULL THEN
    RAISE EXCEPTION 'paid_at was not set';
  END IF;
  IF (SELECT available_balance FROM public.wallets WHERE id='62000000-0000-4000-8000-000000000001') <> 500 THEN
    RAISE EXCEPTION 'marking paid must not debit the wallet a second time';
  END IF;
  IF (SELECT status FROM public.payouts WHERE id='63000000-0000-4000-8000-000000000002') <> 'failed' THEN
    RAISE EXCEPTION 'failed transfer status not recorded';
  END IF;
  IF (SELECT available_balance FROM public.wallets WHERE id='62000000-0000-4000-8000-000000000002') <> 700 THEN
    RAISE EXCEPTION 'failed transfer must restore reserved wallet amount exactly once';
  END IF;
  IF (SELECT count(*) FROM public.ledger_entries WHERE reference='PAYOUT-FAIL-63000000-0000-4000-8000-000000000002') <> 1 THEN
    RAISE EXCEPTION 'failed payout compensating ledger entry missing';
  END IF;
  IF (SELECT count(*) FROM public.admin_actions WHERE target_type='payout') <> 2 THEN
    RAISE EXCEPTION 'payout admin action audit records missing';
  END IF;
  IF (SELECT count(*) FROM public.audit_logs WHERE entity_type='payout') <> 2 THEN
    RAISE EXCEPTION 'payout audit log records missing';
  END IF;

  BEGIN
    PERFORM public.admin_finalize_payout(
      '63000000-0000-4000-8000-000000000001','paid','BANK-TRANSFER-REVANT-001',NULL
    );
    RAISE EXCEPTION 'already paid payout must not be finalized again';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'already paid payout must not be finalized again' THEN RAISE; END IF;
  END;

  BEGIN
    PERFORM public.admin_finalize_payout(
      '63000000-0000-4000-8000-000000000002','failed',NULL,'Transfert externe rejeté par le prestataire'
    );
    RAISE EXCEPTION 'already failed payout must not restore funds twice';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'already failed payout must not restore funds twice' THEN RAISE; END IF;
  END;
END;
$$;

RESET ROLE;
ROLLBACK;
