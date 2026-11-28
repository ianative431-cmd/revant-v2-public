-- Keep the private KYC Storage bucket aligned with the server-side 8 MiB upload limit.
-- Storage also accepts direct authenticated uploads under each user's own folder, so
-- the bucket itself must enforce the same limit rather than relying only on the form.

do $$
begin
  update storage.buckets
  set file_size_limit = 8388608,
      allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png']::text[]
  where id = 'kyc-documents';

  if not found then
    raise exception 'kyc_documents_bucket_missing';
  end if;
end;
$$;
