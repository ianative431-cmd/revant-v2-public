import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Background, UserBackground } from "@/types/background";

export async function getActiveBackgrounds(supabase: SupabaseClient): Promise<Background[]> {
  const { data } = await supabase
    .from("backgrounds")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  return (data ?? []) as Background[];
}

/** Réservé à l'admin : la RLS (backgrounds_admin_all) autorise aussi les inactifs. */
export async function getAllBackgroundsForAdmin(supabase: SupabaseClient): Promise<Background[]> {
  const { data } = await supabase
    .from("backgrounds")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
  return (data ?? []) as Background[];
}

export async function getUserBackgrounds(
  supabase: SupabaseClient,
  ownerId: string
): Promise<UserBackground[]> {
  const { data } = await supabase
    .from("user_backgrounds")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  return (data ?? []) as UserBackground[];
}

export async function countShopsUsingBackground(
  supabase: SupabaseClient,
  backgroundId: string
): Promise<number> {
  const { count } = await supabase
    .from("shops")
    .select("id", { count: "exact", head: true })
    .eq("background_id", backgroundId);
  return count ?? 0;
}

export async function getBackgroundById(
  supabase: SupabaseClient,
  id: string
): Promise<Background | null> {
  const { data } = await supabase.from("backgrounds").select("*").eq("id", id).maybeSingle();
  return (data as Background) ?? null;
}
