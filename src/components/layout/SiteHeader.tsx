import { createSupabaseServerClient } from "@/lib/supabase/server";
import FloatingNavigation from "./FloatingNavigation";

export default async function SiteHeader({ hideSearch = false }: { hideSearch?: boolean }) {
  let allowAdd = false;
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    allowAdd = Boolean(user);
  } catch {
    allowAdd = false;
  }

  return <FloatingNavigation hideSearch={hideSearch} allowAdd={allowAdd} />;
}
