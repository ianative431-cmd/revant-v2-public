"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/server/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function cleanText(value: FormDataEntryValue | null, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function parseId(value: FormDataEntryValue | null): string | null {
  const id = cleanText(value, 64);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ? id : null;
}

function parseHttpsUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" || !parsed.hostname || parsed.username || parsed.password) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function parseSortOrder(value: FormDataEntryValue | null): number {
  const parsed = Number(typeof value === "string" ? value : "0");
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 10000 ? parsed : 0;
}

async function writeAudit(admin: ReturnType<typeof createSupabaseAdminClient>, actorId: string, linkId: string, action: string, title: string) {
  await admin.from("audit_logs").insert({
    action: "config_change",
    actor_id: actorId,
    entity_type: "external_destination_link",
    entity_id: linkId,
    description: `${action} : ${title}`,
    metadata: { action, title },
  });
}

function refreshMaisonPaths() {
  revalidatePath("/maison");
  revalidatePath("/admin/maison");
  revalidatePath("/");
}

export async function createMaisonLink(formData: FormData) {
  const actor = await requireSuperAdmin();
  const title = cleanText(formData.get("title"), 100);
  const url = parseHttpsUrl(cleanText(formData.get("url"), 2048));
  const description = cleanText(formData.get("description"), 300) || null;
  const sort_order = parseSortOrder(formData.get("sort_order"));
  if (title.length < 2 || !url) redirect("/admin/maison?status=invalid");

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("external_destination_links").insert({
    title, url, description, sort_order, is_active: true, created_by: actor.id, updated_by: actor.id,
  }).select("id").single();
  if (error || !data) redirect("/admin/maison?status=database_error");
  await writeAudit(admin, actor.id, data.id, "create", title);
  refreshMaisonPaths();
  redirect("/admin/maison?status=created");
}

export async function updateMaisonLink(formData: FormData) {
  const actor = await requireSuperAdmin();
  const id = parseId(formData.get("id"));
  const title = cleanText(formData.get("title"), 100);
  const url = parseHttpsUrl(cleanText(formData.get("url"), 2048));
  const description = cleanText(formData.get("description"), 300) || null;
  const sort_order = parseSortOrder(formData.get("sort_order"));
  if (!id || title.length < 2 || !url) redirect("/admin/maison?status=invalid");

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("external_destination_links").update({
    title, url, description, sort_order, updated_by: actor.id, updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) redirect("/admin/maison?status=database_error");
  await writeAudit(admin, actor.id, id, "update", title);
  refreshMaisonPaths();
  redirect("/admin/maison?status=updated");
}

export async function setMaisonLinkActive(formData: FormData) {
  const actor = await requireSuperAdmin();
  const id = parseId(formData.get("id"));
  const nextValue = formData.get("is_active") === "true";
  const title = cleanText(formData.get("title"), 100) || "destination";
  if (!id) redirect("/admin/maison?status=invalid");

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("external_destination_links").update({
    is_active: nextValue, updated_by: actor.id, updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) redirect("/admin/maison?status=database_error");
  await writeAudit(admin, actor.id, id, nextValue ? "activate" : "deactivate", title);
  refreshMaisonPaths();
  redirect(`/admin/maison?status=${nextValue ? "activated" : "deactivated"}`);
}
