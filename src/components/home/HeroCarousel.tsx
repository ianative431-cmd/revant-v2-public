"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
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
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, AUTOPLAY_INTERVAL);
    return () => window.clearInterval(timer);
  }, [reducedMotion, shouldPause, slides.length]);

  if (slides.length === 0) return null;
  const activeSlide = slides[activeIndex] ?? slides[0];
  if (!activeSlide) return null;

  return (
    <section
      className="relative mx-3 mt-1 min-h-[330px] overflow-hidden rounded-2xl bg-[#142B45] text-white sm:min-h-[390px]"
      role="region"
      aria-roledescription="carrousel"
      aria-label="À la une"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setHasFocus(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHasFocus(false);
      }}
    >
      <div className="absolute inset-0" aria-hidden="true">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`revant-hero-slide absolute inset-0 bg-cover bg-[center_35%] transition-[opacity,transform] duration-700 ease-in-out ${index === activeIndex ? "is-active opacity-80" : "opacity-0"} ${reducedMotion ? "duration-0" : ""}`}
            style={{ backgroundImage: `url("${slide.image}")` }}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/15" aria-hidden="true" />
      <div className="relative z-10 flex min-h-[330px] items-center px-6 py-10 sm:min-h-[390px] sm:px-12">
        <div
          key={activeSlide.id}
          role="group"
          aria-roledescription="diapositive"
          aria-label={`Diapositive ${activeIndex + 1} sur ${slides.length}`}
          aria-live="off"
          className="revant-hero-copy max-w-lg"
        >
          <p className="mb-3 text-[11px] font-semibold tracking-[0.22em] text-white/75">{activeSlide.eyebrow}</p>
          <h1 className="mb-4 text-3xl font-black leading-[1.04] tracking-tight sm:text-5xl">{activeSlide.title}</h1>
          <p className="mb-6 max-w-sm text-sm leading-relaxed text-white/85">{activeSlide.description}</p>
          <Link href={activeSlide.ctaHref} className="inline-flex items-center gap-3 rounded-md bg-[#F46A18] px-5 py-3 text-xs font-bold text-white transition hover:bg-[#FF914D]">
            {activeSlide.ctaLabel} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
      {slides.length > 1 && (
        <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 items-center" role="group" aria-label="Choisir une bannière">
          {slides.map((slide, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={slide.id}
                type="button"
                aria-label={`Afficher la bannière ${index + 1} : ${slide.title}`}
                aria-pressed={isActive}
                onClick={() => setActiveIndex(index)}
                className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span className={`h-2.5 rounded-full transition-all duration-300 ${isActive ? "w-6 bg-[#F46A18]" : "w-2.5 border border-white/90 bg-white/35"}`} />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
