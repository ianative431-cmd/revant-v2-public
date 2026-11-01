import MaisonAdminPage from "./MaisonAdminPage";
import { requireSuperAdmin } from "@/server/auth/roles";
export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireSuperAdmin();
  return <MaisonAdminPage searchParams={searchParams} />;
}
