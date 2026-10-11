import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_DESTINATIONS = new Set(["/compte", "/compte/boutique", "/admin"]);

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next") ?? "/compte";
  const next = ALLOWED_DESTINATIONS.has(requestedNext) ? requestedNext : "/compte";
  const isAdminFlow = next === "/admin";

  const errorUrl = new URL("/auth/erreur", requestUrl.origin);
  errorUrl.searchParams.set("flow", isAdminFlow ? "admin" : "seller");

  if (!code) {
    errorUrl.searchParams.set("reason", "callback");
    return NextResponse.redirect(errorUrl);
  }

  const supabase = await createSupabaseServerClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    errorUrl.searchParams.set("reason", "exchange");
    return NextResponse.redirect(errorUrl);
  }

  if (isAdminFlow) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      await supabase.auth.signOut();
      errorUrl.searchParams.set("reason", "session");
      return NextResponse.redirect(errorUrl);
    }

    const { data: assignments, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (roleError || !assignments?.some((assignment) => assignment.role === "super_admin")) {
      await supabase.auth.signOut();
      errorUrl.searchParams.set("reason", "not_admin");
      return NextResponse.redirect(errorUrl);
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
