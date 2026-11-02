import { permanentRedirect } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

/**
 * Compatibility route for older shared shop URLs.
 * The canonical public storefront remains /shop/[slug].
 */
export default async function LegacyShopPage({ params }: Props): Promise<never> {
  const { slug } = await params;
  permanentRedirect(`/shop/${encodeURIComponent(slug)}`);
}
