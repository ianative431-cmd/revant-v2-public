-- Secure, immutable document registry for Revant receipts and invoices.
-- This migration is intentionally reviewed in a PR first; it is NOT applied
-- to the active Supabase project by this commit.

CREATE SEQUENCE IF NOT EXISTS public.receipt_document_number_seq
  AS bigint
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

CREATE TABLE IF NOT EXISTS public.receipt_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  document_type text NOT NULL CHECK (document_type IN ('receipt', 'invoice')),
  document_number text NOT NULL UNIQUE,
  document_snapshot jsonb NOT NULL CHECK (jsonb_typeof(document_snapshot) = 'object'),
  issued_at timestamptz NOT NULL DEFAULT now(),
  verification_revoked_at timestamptz,
  revocation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT receipt_documents_order_type_unique UNIQUE (order_id, document_type),
  CONSTRAINT receipt_documents_revocation_pair CHECK (
    (verification_revoked_at IS NULL AND revocation_reason IS NULL)
    OR
    (verification_revoked_at IS NOT NULL AND length(trim(revocation_reason)) BETWEEN 5 AND 500)
  )
);

CREATE INDEX IF NOT EXISTS receipt_documents_issued_at_idx
  ON public.receipt_documents (issued_at DESC);

CREATE INDEX IF NOT EXISTS receipt_documents_order_id_idx
  ON public.receipt_documents (order_id);

CREATE OR REPLACE FUNCTION public.assign_receipt_document_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.document_number IS NULL OR trim(NEW.document_number) = '' THEN
    NEW.document_number :=
      CASE NEW.document_type
        WHEN 'receipt' THEN 'RVT-REC-'
        WHEN 'invoice' THEN 'RVT-FAC-'
      END
      || to_char(clock_timestamp(), 'YYYY')
      || '-'
      || lpad(nextval('public.receipt_document_number_seq'::regclass)::text, 8, '0');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.guard_receipt_document_immutability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'receipt documents cannot be deleted';
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.order_id IS DISTINCT FROM OLD.order_id
    OR NEW.document_type IS DISTINCT FROM OLD.document_type
    OR NEW.document_number IS DISTINCT FROM OLD.document_number
    OR NEW.document_snapshot IS DISTINCT FROM OLD.document_snapshot
    OR NEW.issued_at IS DISTINCT FROM OLD.issued_at
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'receipt document content is immutable';
  END IF;

  IF OLD.verification_revoked_at IS NOT NULL
    AND (
      NEW.verification_revoked_at IS DISTINCT FROM OLD.verification_revoked_at
      OR NEW.revocation_reason IS DISTINCT FROM OLD.revocation_reason
    ) THEN
    RAISE EXCEPTION 'receipt document revocation is permanent';
  END IF;

  IF OLD.verification_revoked_at IS NULL
    AND NEW.verification_revoked_at IS NOT NULL
    AND (NEW.revocation_reason IS NULL OR length(trim(NEW.revocation_reason)) NOT BETWEEN 5 AND 500) THEN
    RAISE EXCEPTION 'a revocation reason is required';
  END IF;

  IF OLD.verification_revoked_at IS NOT NULL
    AND NEW.verification_revoked_at IS NULL THEN
    RAISE EXCEPTION 'receipt document revocation cannot be reversed';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS receipt_documents_assign_number
  ON public.receipt_documents;
CREATE TRIGGER receipt_documents_assign_number
  BEFORE INSERT ON public.receipt_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_receipt_document_number();

DROP TRIGGER IF EXISTS receipt_documents_immutable
  ON public.receipt_documents;
CREATE TRIGGER receipt_documents_immutable
  BEFORE UPDATE OR DELETE ON public.receipt_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_receipt_document_immutability();

ALTER TABLE public.receipt_documents ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.receipt_documents
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.receipt_documents
  TO service_role;

REVOKE ALL PRIVILEGES ON SEQUENCE public.receipt_document_number_seq
  FROM PUBLIC, anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.receipt_document_number_seq
  TO service_role;

REVOKE ALL ON FUNCTION public.assign_receipt_document_number() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_receipt_document_immutability() FROM PUBLIC;

COMMENT ON TABLE public.receipt_documents IS
  'Immutable snapshots of issued Revant receipts and invoices. Access is server-side only.';
COMMENT ON COLUMN public.receipt_documents.document_snapshot IS
  'Immutable document content snapshot; must not contain QR bearer tokens or unnecessary personal data.';
COMMENT ON COLUMN public.receipt_documents.verification_revoked_at IS
  'Permanent revocation of public authenticity verification; the document history itself is retained.';
