-- Defense in depth: public clients may read active destinations but cannot mutate them.
revoke insert, update, delete on public.external_destination_links from public, anon, authenticated;
grant select on public.external_destination_links to anon, authenticated;
