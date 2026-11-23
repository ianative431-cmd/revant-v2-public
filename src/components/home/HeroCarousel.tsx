"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
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
  imageFit?: "cover" | "contain";
};

const AUTOPLAY_INTERVAL = 6500;

export default function HeroCarousel({ slides }: { slides: readonly HeroSlide[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const shouldPause = isHovered || hasFocus;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (reducedMotion !== false || shouldPause || slides.length < 2) return;
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % slides.length), AUTOPLAY_INTERVAL);
    return () => window.clearInterval(timer);
  }, [reducedMotion, shouldPause, slides.length]);

  if (slides.length === 0) return null;
  const activeSlide = slides[activeIndex] ?? slides[0];
  if (!activeSlide) return null;

  return (
    <section
      className="revant-hero"
      role="region"
      aria-roledescription="carrousel"
      aria-label="À la une Revant"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setHasFocus(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHasFocus(false); }}
    >
      <div className="revant-hero__image" aria-hidden="true">
        {slides.map((slide, index) => (
          <div key={slide.id} className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === activeIndex ? "opacity-100" : "opacity-0"} ${reducedMotion ? "duration-0" : ""}`}>
            <Image src={slide.image} alt="" fill priority={index === 0} sizes="(max-width: 640px) 100vw, 58vw" style={{ objectFit: slide.imageFit ?? "cover" }} />
          </div>
        ))}
      </div>
      <div className="revant-hero__veil" aria-hidden="true" />
      <div key={activeSlide.id} className="revant-hero__copy" role="group" aria-roledescription="diapositive" aria-label={`Diapositive ${activeIndex + 1} sur ${slides.length}`} aria-live="off">
        <p className="revant-hero__eyebrow">{activeSlide.eyebrow}</p>
        <h1 id="revant-home-title" className="revant-hero__title">{activeSlide.title} <em>{activeSlide.accent}</em></h1>
        <p className="revant-hero__description">{activeSlide.description}</p>
        <div className="revant-hero__actions">
          <Link href={activeSlide.ctaHref} className="revant-hero__cta">{activeSlide.ctaLabel} <ArrowRight size={16} aria-hidden="true" /></Link>
          {activeSlide.secondaryLabel && activeSlide.secondaryHref && <Link href={activeSlide.secondaryHref} className="revant-hero__cta revant-hero__cta--quiet">{activeSlide.secondaryLabel}</Link>}
        </div>
      </div>
      {slides.length > 1 && (
        <div className="revant-hero__dots" role="group" aria-label="Choisir une bannière">
          {slides.map((slide, index) => (
            <button key={slide.id} type="button" aria-label={`Afficher la bannière ${index + 1} : ${slide.title} ${slide.accent}`} aria-pressed={index === activeIndex} onClick={() => setActiveIndex(index)}>
              <span className={index === activeIndex ? "is-active" : ""} />
            </button>
          ))}
        </div>
      )}
      <span className="revant-hero__index" aria-hidden="true">Le marché, autrement · Niger</span>
    </section>
  );
}
