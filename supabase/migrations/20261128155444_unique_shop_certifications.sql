-- A shop can have only one certification record per certification type.
-- This prevents duplicate badges when approval and retry actions race.
create unique index if not exists certifications_shop_type_unique
on public.certifications(shop_id, type);
