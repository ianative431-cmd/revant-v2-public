-- Migration : limitation de taux (rate limiting) côté serveur.
--
-- Fait suite à 0010_restaurant_shop_type.sql.
--
-- But : compteur persistant et atomique, partagé par toutes les
-- instances du service (contrairement à un compteur en mémoire, qui
-- ne protégerait rien dès que Render fait tourner plusieurs instances
-- ou redémarre). La table n'est accessible par AUCUN rôle client
-- (RLS activé, aucune policy) — uniquement via le client "service
-- role" côté serveur (voir src/lib/supabase/admin.ts), jamais depuis
-- le navigateur.

create table if not exists public.rate_limit_attempts (
  key text primary key,
  window_start timestamptz not null default now(),
  count integer not null default 0
);

alter table public.rate_limit_attempts enable row level security;
-- Volontairement aucune policy : ni anon ni authenticated n'a accès.
-- Seul le client service role (qui contourne RLS) peut lire/écrire.

-- Fenêtre glissante simplifiée (fenêtre fixe) : incrémente le
-- compteur pour la clé donnée ; le réinitialise si la fenêtre
-- précédente a expiré. Retourne true si la tentative est autorisée
-- (compteur <= max_attempts après incrément), false sinon.
--
-- SECURITY DEFINER + search_path figé : la fonction s'exécute avec
-- les droits du propriétaire (contourne RLS volontairement, c'est son
-- rôle), jamais avec un search_path manipulable par l'appelant.
create or replace function public.check_rate_limit(
  p_key text,
  p_max_attempts integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.rate_limit_attempts (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update
  set
    count = case
      when public.rate_limit_attempts.window_start < now() - make_interval(secs => p_window_seconds)
        then 1
      else public.rate_limit_attempts.count + 1
    end,
    window_start = case
      when public.rate_limit_attempts.window_start < now() - make_interval(secs => p_window_seconds)
        then now()
      else public.rate_limit_attempts.window_start
    end
  returning count into v_count;

  return v_count <= p_max_attempts;
end;
$$;

comment on table public.rate_limit_attempts is
  'Compteurs de limitation de taux (connexion, inscription, codes SMS, etc.). Jamais accessible depuis le client — service role uniquement. Voir src/server/security/rate-limit.ts.';
