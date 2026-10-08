import Link from "next/link";
import { notFound } from "next/navigation";
import { getLegalDocument, LEGAL_DOCUMENTS } from "@/content/legal/documents";
import { LEGAL_DISCLAIMER } from "@/content/legal/types";

export function generateStaticParams() {
  return LEGAL_DOCUMENTS.map((doc) => ({ slug: doc.slug }));
}

export default async function LegalDocumentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = getLegalDocument(slug);
  if (!doc) notFound();

  return (
    <div className="min-h-screen bg-brand-bg px-4 py-10">
      <div className="max-w-2xl mx-auto bg-white rounded-[22px] p-8">
        <Link href="/legal" className="text-sm underline text-brand-text/60">
          ← Centre juridique
        </Link>

        <h1 className="text-2xl font-bold mt-4 mb-1">{doc.title}</h1>
        <p className="text-xs text-brand-text/60 mb-6">
          Version {doc.version} — en vigueur depuis le{" "}
          {new Date(doc.effectiveDate).toLocaleDateString("fr-FR")}
        </p>

        <p className="text-xs bg-brand-text/5 rounded-xl p-3 mb-6 text-brand-text/70">
          {LEGAL_DISCLAIMER}
        </p>

        {doc.sections.map((section) => (
          <div key={section.heading} className="mb-5">
            <h2 className="text-base font-semibold mb-2">{section.heading}</h2>
            {section.body.map((paragraph, i) => (
              <p key={i} className="text-sm text-brand-text/80 mb-2">
                {paragraph}
              </p>
            ))}
          </div>
        ))}

        {doc.legalReviewNeeded.length > 0 && (
          <div className="mt-8 border border-amber-300 bg-amber-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-800 mb-2">
              Points nécessitant une validation juridique avant lancement commercial
            </p>
            <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
              {doc.legalReviewNeeded.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
