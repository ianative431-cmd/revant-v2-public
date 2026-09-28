import Link from "next/link";
import Image from "next/image";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllBackgroundsForAdmin, countShopsUsingBackground } from "@/server/backgrounds/backgrounds";
import { officialBackgroundPublicUrl } from "@/lib/background-image";
import { env } from "@/lib/env";
import BackgroundAdminRow from "./BackgroundAdminRow";

export default async function AdminArrierePlansPage() {
  const supabase = await createSupabaseServerClient();
  const backgrounds = await getAllBackgroundsForAdmin(supabase);
  const supabaseUrl = env.supabaseUrl();

  const usageCounts = await Promise.all(
    backgrounds.map((bg) => countShopsUsingBackground(supabase, bg.id))
  );

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Bibliothèque visuelle</h1>
        <Link
          href="/admin/arriere-plans/nouveau"
          className="bg-black text-white rounded-full px-4 py-2 text-xs font-medium"
        >
          + Ajouter
        </Link>
      </div>

      <p className="text-xs text-black/60 mb-4">
        {backgrounds.length} arrière-plan{backgrounds.length > 1 ? "s" : ""} —{" "}
        {backgrounds.filter((b) => b.is_active).length} actif
        {backgrounds.filter((b) => b.is_active).length > 1 ? "s" : ""}.
      </p>

      {backgrounds.length === 0 ? (
        <p className="text-sm text-black/60 text-center py-10">
          Aucun arrière-plan pour l&apos;instant. Ajoute la première image officielle.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {backgrounds.map((bg, i) => (
            <div key={bg.id} className="flex gap-3 bg-white rounded-2xl p-3">
              <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-black/5 shrink-0">
                <Image
                  src={officialBackgroundPublicUrl(supabaseUrl, bg.image_path)}
                  alt={bg.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <BackgroundAdminRow background={bg} usageCount={usageCounts[i]} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
