import Link from "next/link";

export default function RevantPromoBanner() {
  return (
    <Link
      href="/boutiques"
      aria-label="Découvrir les boutiques Revant : mode, maison et terroir"
      className="group relative mx-3 mt-4 block overflow-hidden rounded-2xl border border-brand-border bg-[#A84325] shadow-sm transition hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
    >
      <div
        aria-hidden="true"
        className="h-[112px] w-full bg-cover bg-center sm:h-[150px] lg:h-[170px]"
        style={{ backgroundImage: "url('/images/revant-home-promo.svg')" }}
      />
      <span className="sr-only">Les bonnes trouvailles commencent ici. Mode, maison et terroir. Explorer les boutiques.</span>
    </Link>
  );
}
