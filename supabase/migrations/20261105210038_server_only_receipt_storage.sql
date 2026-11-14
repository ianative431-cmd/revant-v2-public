-- Receipt objects are accessed only through trusted server-side code.
-- The bucket remains private; clients must never upload or read receipt files directly.
DROP POLICY IF EXISTS "revant receipts insert" ON storage.objects;
DROP POLICY IF EXISTS "revant receipts select" ON storage.objects;
