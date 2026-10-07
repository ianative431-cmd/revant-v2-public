"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUserWithLegalConsent } from "@/server/legal/consent";
import { slugify, isValidSlug } from "@/lib/slug";
import { getShopByOwnerId } from "@/server/shops/shops";
import { getPaletteById, getPalettesForShopType } from "@/content/shops/color-palettes";

export type ShopActionState = { error: string | null };

/** Types de boutique qu'un utilisateur peut choisir lui-même à la création. */
const SELF_SERVICE_SHOP_TYPES = ["standard", "restaurant"] as const;
type SelfServiceShopType = (typeof SELF_SERVICE_SHOP_TYPES)[number];

const NAME_MIN = 2;
const NAME_MAX = 80;
const DESCRIPTION_MAX = 1000;

function isValidName(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= NAME_MIN && trimmed.length <= NAME_MAX;
}

type ServerSupabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/**
 * Trouve un slug disponible en partant du nom de boutique choisi, en
 * ajoutant un suffixe numérique en cas de collision. Ceci n'est qu'une
 * tentative "conviviale" côté application — l'unicité réelle reste de
 * toute façon garantie par la contrainte "unique" en base de données.
 */
async function findAvailableSlug(supabase: ServerSupabase, desired: string): Promise<string> {
  const base = slugify(desired) || "boutique";
  const root = base.length >= 3 ? base : `${base}-boutique`;
  let candidate = root;
  let suffix = 2;

  // Borne la boucle : largement suffisant en pratique, et évite tout
  // risque de boucle infinie en cas de comportement inattendu.
  for (let attempts = 0; attempts < 25; attempts++) {
    const { data: slugTaken } = await supabase
      .from("shops")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!slugTaken) return candidate;
    candidate = `${root}-${suffix}`;
    suffix += 1;
  }

  // Dernier recours : suffixe unique basé sur l'horodatage, pour ne
  // jamais bloquer la création d'une boutique.
  return `${root}-${Date.now().toString(36)}`;
}

export async function createShop(
  _prevState: ShopActionState,
  formData: FormData
): Promise<ShopActionState> {
  const user = await requireUserWithLegalConsent();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const requestedType = String(formData.get("shopType") ?? "standard").trim();

  if (!isValidName(name)) {
    return { error: `Le nom de la boutique doit contenir entre ${NAME_MIN} et ${NAME_MAX} caractères.` };
  }
  if (description.length > DESCRIPTION_MAX) {
    return { error: `La description ne peut pas dépasser ${DESCRIPTION_MAX} caractères.` };
  }
  // Revérification côté serveur : seuls "standard" et "restaurant" sont
  // auto-attribuables (voir SELF_SERVICE_SHOP_TYPES) — "pro" et
  // "fournisseur" ne peuvent être obtenus que par l'administration, et
  // la policy RLS shops_owner_insert (migration 0010) applique de toute
  // façon la même règle au niveau base de données.
  if (!(SELF_SERVICE_SHOP_TYPES as readonly string[]).includes(requestedType)) {
    return { error: "Type de commerce invalide." };
  }
  const shopType = requestedType as SelfServiceShopType;

  const supabase = await createSupabaseServerClient();

  const existing = await getShopByOwnerId(supabase, user.id);
  if (existing) {
    // Un seul compte = une seule boutique pour l'instant. On redirige
    // simplement vers la boutique existante plutôt que de renvoyer une
    // erreur confuse à quelqu'un qui a rouvert ce formulaire par erreur.
    redirect("/compte/boutique");
  }

  const slug = await findAvailableSlug(supabase, name);

  const { error } = await supabase.from("shops").insert({
    owner_id: user.id,
    slug,
    name,
    description: description.length > 0 ? description : null,
    is_restaurant: shopType === "restaurant",
  });

  if (error) {
    return { error: "Impossible de créer la boutique. Réessaie plus tard." };
  }

  redirect("/compte/boutique");
}

export async function updateShop(
  _prevState: ShopActionState,
  formData: FormData
): Promise<ShopActionState> {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();

  const shop = await getShopByOwnerId(supabase, user.id);
  if (!shop) {
    return { error: "Aucune boutique associée à ce compte." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const requestedSlug = slugify(String(formData.get("slug") ?? "").trim());

  if (!isValidName(name)) {
    return { error: `Le nom de la boutique doit contenir entre ${NAME_MIN} et ${NAME_MAX} caractères.` };
  }
  if (description.length > DESCRIPTION_MAX) {
    return { error: `La description ne peut pas dépasser ${DESCRIPTION_MAX} caractères.` };
  }
  if (!isValidSlug(requestedSlug)) {
    return {
      error: "Adresse de boutique invalide (3 à 40 caractères : lettres, chiffres, tirets).",
    };
  }

  let finalSlug = shop.slug;

  if (requestedSlug !== shop.slug) {
    const { data: slugTaken } = await supabase
      .from("shops")
      .select("id")
      .eq("slug", requestedSlug)
      .maybeSingle();

    if (slugTaken) {
      return { error: "Cette adresse de boutique est déjà utilisée." };
    }

    // NB : contrairement à une version antérieure, l'ancien slug n'est
    // plus archivé (table shop_slug_history retirée du schéma actuel) —
    // un ancien lien partagé cessera donc de fonctionner après un
    // changement d'adresse. À signaler à l'utilisateur si besoin.
    finalSlug = requestedSlug;
  }

  const { error } = await supabase
    .from("shops")
    .update({
      name,
      description: description.length > 0 ? description : null,
      slug: finalSlug,
    })
    .eq("id", shop.id);

  if (error) {
    return { error: "Impossible d'enregistrer les modifications. Réessaie plus tard." };
  }

  redirect("/compte/boutique");
}

/**
 * Attribution d'une palette de couleurs prédéfinie à la boutique
 * (section 9 du prompt maître). L'écran ne propose que les palettes
 * autorisées pour le type de boutique concerné, mais on revérifie ici
 * côté serveur — jamais uniquement côté frontend (SECURITY.md).
 */
export async function selectShopColorPalette(
  _prevState: ShopActionState,
  formData: FormData
): Promise<ShopActionState> {
  const user = await requireUserWithLegalConsent();
  const supabase = await createSupabaseServerClient();

  const shop = await getShopByOwnerId(supabase, user.id);
  if (!shop) {
    return { error: "Aucune boutique associée à ce compte." };
  }

  const paletteId = String(formData.get("paletteId") ?? "").trim();
  const palette = getPaletteById(paletteId);

  if (!palette) {
    return { error: "Palette introuvable." };
  }

  const allowedPalettes = getPalettesForShopType(shop);
  if (!allowedPalettes.some((p) => p.id === palette.id)) {
    return { error: "Cette palette n'est pas disponible pour ce type de boutique." };
  }

  const { error } = await supabase
    .from("shops")
    .update({ background_color: palette.id })
    .eq("id", shop.id);

  if (error) {
    return { error: "Impossible d'enregistrer la palette. Réessaie plus tard." };
  }

  redirect("/compte/boutique/personnaliser");
}
