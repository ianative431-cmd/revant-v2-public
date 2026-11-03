-- The Data API roles only need normal row operations governed by RLS.
-- TRUNCATE bypasses row-level policies; TRIGGER, REFERENCES and MAINTAIN
-- are not required by the application-facing anon/authenticated roles.
revoke maintain, truncate, trigger, references
on all tables in schema public
from anon, authenticated;

-- Prevent the same elevated table privileges from being granted by default
-- to future tables created by the migration owner.
alter default privileges for role postgres
revoke maintain, truncate, trigger, references
on tables from anon, authenticated;

alter default privileges for role postgres in schema public
revoke maintain, truncate, trigger, references
on tables from anon, authenticated;
