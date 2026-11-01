-- KYC decisions are updated by trusted moderation workflows, but records
-- must not be deleted or truncated through the service API role.
REVOKE DELETE, TRUNCATE ON TABLE public.kyc_profiles FROM service_role;
