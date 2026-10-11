import MaisonAdminPage from "./MaisonAdminPage";
export default function Page({ searchParams }: { searchParams: Promise<{ status?: string }> }) { return <MaisonAdminPage searchParams={searchParams} />; }
