-- Add a SHA-256 digest for opaque receipt verification bearer tokens.
-- Raw QR tokens are never stored in the database.
ALTER TABLE public.receipt_documents
  ADD COLUMN IF NOT EXISTS verification_token_hash text;

ALTER TABLE public.receipt_documents
  ADD CONSTRAINT receipt_documents_token_hash_format
  CHECK (
    verification_token_hash IS NULL
    OR verification_token_hash ~ '^[0-9a-f]{64}$'
  );

CREATE UNIQUE INDEX IF NOT EXISTS receipt_documents_token_hash_unique
  ON public.receipt_documents (verification_token_hash)
  WHERE verification_token_hash IS NOT NULL;

COMMENT ON COLUMN public.receipt_documents.verification_token_hash IS
  'SHA-256 digest of a cryptographically random QR bearer token; raw token must never be stored.';
