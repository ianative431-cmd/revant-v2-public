"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const AUTH_ROUTES = new Set([
  "/connexion",
  "/inscription",
  "/mot-de-passe-oublie",
  "/reinitialiser-mot-de-passe",
]);

const ROOT_SECTIONS = new Set([
  "/",
  "/messages",
  "/panier",
  "/parametres",
  "/compte",
  "/wallet",
  "/boutiques",
]);

function shouldShowBackButton(pathname: string): boolean {
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth/")
  ) {
    return false;
  }

  if (AUTH_ROUTES.has(pathname)) return true;
  if (pathname === "/categories" || pathname.startsWith("/categories/")) return true;
  if (pathname.startsWith("/produit/") || pathname.startsWith("/shop/")) return true;
  if (ROOT_SECTIONS.has(pathname)) return false;

  return pathname.split("/").filter(Boolean).length > 1;
}

function getFallbackPath(pathname: string): string {
  if (AUTH_ROUTES.has(pathname)) return "/";
  if (pathname === "/categories" || pathname.startsWith("/categories/")) return "/categories";
  if (pathname.startsWith("/produit/")) return "/categories";
  if (pathname.startsWith("/shop/")) return "/boutiques";
  if (pathname.startsWith("/messages/")) return "/messages";
  if (pathname.startsWith("/compte/")) return "/compte";
  if (pathname.startsWith("/parametres/")) return "/parametres";
  if (pathname.startsWith("/wallet/")) return "/wallet";
  if (pathname.startsWith("/panier/") || pathname.startsWith("/commande/")) return "/panier";
  if (pathname.startsWith("/boutiques/")) return "/boutiques";

  const segments = pathname.split("/").filter(Boolean);
  return segments.length > 1 ? `/${segments.slice(0, -1).join("/")}` : "/";
}

export default function FloatingBackButton() {
  const pathname = usePathname();
  const router = useRouter();
  const routeStack = useRef<string[]>([]);

  useEffect(() => {
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      const existingIndex = routeStack.current.lastIndexOf(currentPath);

      if (existingIndex >= 0) {
        routeStack.current = routeStack.current.slice(0, existingIndex + 1);
      } else {
        routeStack.current.push(currentPath);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const stack = routeStack.current;
    if (stack[stack.length - 1] !== pathname) {
      stack.push(pathname);
      if (stack.length > 40) stack.splice(0, stack.length - 40);
    }
  }, [pathname]);

  if (!pathname || !shouldShowBackButton(pathname)) return null;

  function handleBack() {
    const stack = routeStack.current;

    if (stack[stack.length - 1] === pathname && stack.length > 1) {
      stack.pop();
    }

    const previousPath = stack[stack.length - 1];
    router.push(previousPath && previousPath !== pathname ? previousPath : getFallbackPath(pathname));
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Retour à la page précédente"
      title="Retour"
      className="fixed left-3 top-[calc(env(safe-area-inset-top,0px)+76px)] z-[45] flex h-11 w-11 items-center justify-center rounded-full border border-brand-border/80 text-brand-text shadow-[0_4px_18px_rgba(0,0,0,.12)] backdrop-blur-xl transition hover:-translate-x-0.5 hover:border-brand-accent/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
      style={{ backgroundColor: "color-mix(in srgb, var(--brand-surface) 84%, transparent)" }}
    >
      <ArrowLeft size={19} strokeWidth={2} aria-hidden="true" />
    </button>
  );
}
