"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  image: string;
};

export default function HeroCarousel({ slides }: { slides: readonly HeroSlide[] }) {
  const slide = slides[0];
  if (!slide) return null;

  return (
    <section className="revant-hero" aria-labelledby="revant-home-title">
      <div className="revant-hero__image" aria-hidden="true">
        <Image src={slide.image} alt="" fill priority sizes="(max-width: 640px) 100vw, 58vw" />
      </div>
      <div className="revant-hero__veil" aria-hidden="true" />
      <div className="revant-hero__copy">
        <p className="revant-hero__eyebrow">{slide.eyebrow}</p>
        <h1 id="revant-home-title" className="revant-hero__title">{slide.title} <em>{slide.accent}</em></h1>
        <p className="revant-hero__description">{slide.description}</p>
        <div className="revant-hero__actions">
          <Link href={slide.ctaHref} className="revant-hero__cta">{slide.ctaLabel} <ArrowRight size={16} aria-hidden="true" /></Link>
          {slide.secondaryLabel && slide.secondaryHref && <Link href={slide.secondaryHref} className="revant-hero__cta revant-hero__cta--quiet">{slide.secondaryLabel}</Link>}
        </div>
      </div>
      <span className="revant-hero__index" aria-hidden="true">Le marché, autrement · Niger</span>
    </section>
  );
}
