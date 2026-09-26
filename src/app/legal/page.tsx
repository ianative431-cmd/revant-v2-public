import Link from "next/link";
import { getLegalDocumentsByCategory } from "@/content/legal/documents";
import { LEGAL_DISCLAIMER } from "@/content/legal/types";

export const metadata = { title: "Centre juridique — Revant" };

export default function LegalCenterPage() {
  const byCategory = getLegalDocumentsByCategory();

  return (
    <div className="min-h-screen bg-[#EFEFED] px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Centre juridique</h1>
        <p className="text-sm text-neutral-600 mb-6">{LEGAL_DISCLAIMER}</p>

        {[...byCategory.entries()].map(([category, docs]) => (
          <div key={category} className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3">
              {category}
            </h2>
            <div className="bg-white rounded-[18px] divide-y divide-neutral-100 overflow-hidden">
              {docs.map((doc) => (
                <Link
                  key={doc.slug}
                  href={`/legal/${doc.slug}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-neutral-50"
                >
                  <div>
                    <p className="text-sm font-medium">{doc.title}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{doc.summary}</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      Version {doc.version} — en vigueur depuis le{" "}
                      {new Date(doc.effectiveDate).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <span className="text-neutral-400 ml-3">›</span>
                </Link>
              ))}
            </div>
          </div>
        ))}

        <p className="text-xs text-neutral-500 mt-8">
          Une question sur l&apos;un de ces documents ? Écris à{" "}
          <a href="mailto:ianative431@gmail.com" className="underline">
            ianative431@gmail.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
