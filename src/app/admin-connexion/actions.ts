"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMIT_ERROR_MESSAGE,
} from "@/server/security/rate-limit";

export type AdminLoginState = { error: string | null };

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

/**
 * Connexion dédiée à l'espace super-administrateur.
 * L'autorisation est vérifiée en base après authentification.
 * Aucun rôle n'est accepté depuis le formulaire ou user_metadata.
 */
export async function signInSuperAdmin(
  _previousState: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!validEmail(email) || password.length < 1 || password.length > 128) {
    return { error: "E-mail ou mot de passe incorrect." };
  }

  const ip = await getClientIdentifier();
  const [allowedByEmail, allowedByIp] = await Promise.all([
    checkRateLimit(`admin-signin:email:${email}`, 5, 900),
    checkRateLimit(`admin-signin:ip:${ip}`, 15, 900),
  ]);

  if (!allowedByEmail || !allowedByIp) {
    return { error: RATE_LIMIT_ERROR_MESSAGE };
  }

  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return { error: "E-mail ou mot de passe incorrect." };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    await supabase.auth.signOut();
    return { error: "Connexion impossible. Réessaie." };
  }

  const { data: assignments, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (roleError || !assignments?.some((assignment) => assignment.role === "super_admin")) {
    await supabase.auth.signOut();
    return {
      error: "Accès refusé. Ce compte n'est pas autorisé à ouvrir l'espace super-administrateur.",
    };
  }

  redirect("/admin");
}
