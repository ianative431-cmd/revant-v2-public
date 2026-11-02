-- Anonymous visitors can read public catalog data through RLS, but all
-- writes must pass through authenticated user policies or trusted server
-- actions. No public/anon write policies exist in the current schema.
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon;

-- Supabase currently grants broad default table privileges to anon for
-- objects created by either migration owner. Prevent future public tables
-- from silently reintroducing anonymous write grants.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE INSERT, UPDATE, DELETE ON TABLES FROM anon;

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
  REVOKE INSERT, UPDATE, DELETE ON TABLES FROM anon;
