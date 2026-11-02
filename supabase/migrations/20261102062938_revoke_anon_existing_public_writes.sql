-- Remove unused anonymous write grants from existing public tables.
-- RLS is enabled on all public base tables and no anon write policies exist.
-- Public catalogue reads remain available through SELECT grants and RLS.
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon;
