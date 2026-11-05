-- Restrict trigger helper functions to the server-only service role.
REVOKE ALL ON FUNCTION public.assign_receipt_document_number() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_receipt_document_immutability() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assign_receipt_document_number() TO service_role;
GRANT EXECUTE ON FUNCTION public.guard_receipt_document_immutability() TO service_role;
