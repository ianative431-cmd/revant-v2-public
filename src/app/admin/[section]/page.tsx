import { notFound } from "next/navigation";
import { ADMIN_NAV, ADMIN_STUB_REQUIREMENTS } from "@/content/admin/nav";

type Props = { params: Promise<{ section: string }> };

export default async function AdminStubPage({ params }: Props) {
  const { section } = await params;
  const href = `/admin/${section}`;
  const item = ADMIN_NAV.find((n) => n.href === href && !n.ready);

  if (!item) notFound();

  const requirement = ADMIN_STUB_REQUIREMENTS[href];

  return (
    <div>
      <h1 className="text-xl font-bold mb-3">{item.label}</h1>
      <div className="bg-white rounded-2xl p-6 max-w-md">
        <p className="text-sm text-black/70">
          Cette section n&apos;existe pas encore réellement — elle nécessite{" "}
          {requirement ?? "un système qui n'est pas encore construit"}.
        </p>
        <p className="text-xs text-black/40 mt-3">
          Aucune donnée simulée n&apos;est affichée ici tant que ce n&apos;est pas réel.
        </p>
      </div>
    </div>
  );
}
