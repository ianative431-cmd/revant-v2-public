import { permanentRedirect } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

/** Compatibilité avec les liens publics au pluriel : /shops/:slug. */
export default async function ShopPluralAliasPage({ params }: Props) {
  const { slug } = await params;
  permanentRedirect(`/shop/${encodeURIComponent(slug)}`);
}
