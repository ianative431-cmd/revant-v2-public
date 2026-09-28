import Link from "next/link";
import NewBackgroundForm from "./NewBackgroundForm";

export default async function NouvelArrierePlanPage() {
  return (
    <div className="max-w-sm bg-white rounded-[22px] p-8">
      <Link href="/admin/arriere-plans" className="text-sm underline text-black/60">
        ← Bibliothèque visuelle
      </Link>
      <h1 className="text-xl font-bold mt-4 mb-6">Ajouter un arrière-plan</h1>
      <NewBackgroundForm />
    </div>
  );
}
