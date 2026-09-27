import Link from "next/link";
import { requireAdmin } from "@/server/auth/roles";
import NewBackgroundForm from "./NewBackgroundForm";

export default async function NouvelArrierePlanPage() {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-[#F3E9DA] px-4 py-10 flex justify-center">
      <div className="w-full max-w-sm bg-white rounded-[22px] p-8">
        <Link href="/admin/arriere-plans" className="text-sm underline text-black/60">
          ← Bibliothèque visuelle
        </Link>
        <h1 className="text-xl font-bold mt-4 mb-6">Ajouter un arrière-plan</h1>
        <NewBackgroundForm />
      </div>
    </div>
  );
}
