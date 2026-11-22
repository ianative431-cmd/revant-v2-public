import { createSupabaseServerClient } from "@/lib/supabase/server";
import BottomNavClient from "./BottomNavClient";

export default async function BottomNav() {
  let showWallet = false;

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    showWallet = Boolean(user);
  } catch {
    showWallet = false;
  }

  return <BottomNavClient showWallet={showWallet} />;
}
