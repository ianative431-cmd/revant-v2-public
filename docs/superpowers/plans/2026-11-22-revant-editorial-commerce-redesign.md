# Revant Editorial Commerce Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a distinct responsive Revant marketplace design across all 31 specified experiences without losing routes, functionality, data integrity or security.

**Architecture:** Evolve the existing Next.js App Router application in vertical slices. Establish a coherent token layer and reusable editorial patterns, then apply them to buyer discovery/conversion, seller, courier, shared and admin areas while preserving existing server-side data services and actions.

**Tech Stack:** Next.js 16.4.6, React 19.3.1, TypeScript, Tailwind CSS 4, existing CSS variables, Supabase SSR/JS, Capacitor, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-22-revant-editorial-commerce-redesign.md` and `docs/REVANT_COMPLETE_VISUAL_DESIGN_SPEC.md`.

## Global Constraints
- Preserve all 31 experiences and existing routes.
- Use real data only; never synthesize business records or metrics.
- Keep price, stock, payment, delivery, permission and refund decisions server-authoritative.
- Preserve Supabase RLS and production data; no production migrations without separate review.
- Keep changes on the feature branch; do not change `main`, merge or deploy during implementation.
- Preserve the official logo, tangerine accent and alternate dark palette.
- Support mobile, tablet and desktop; respect reduced motion, keyboard access and safe areas.

## Review Focus
- Missing/invalid product and shop media render deliberate placeholders without fake data.
- Unauthenticated visitors retain guest checkout and public catalogue access.
- Dark palette remains readable after global token changes.
- Long French labels, FCFA prices and narrow screens do not overflow.
- Empty, loading, error and unavailable states remain understandable and accessible.

---

### Task 1: Baseline and repository safeguards
**Files:** `AGENTS.md`, `SECURITY.md`, existing design/technical/storefront audits, this plan.
- [x] Confirm feature branch and clean working tree.
- [x] Record unit-test baseline: 29 passing.
- [x] Record lint baseline: 0 errors, 8 warnings.
- [x] Record production dependency audit: 0 vulnerabilities.
- [ ] Fresh production build (remote shell resource limit prevented completion; CI build remains the authoritative path).

### Task 2: Shared visual foundation
**Files:** `src/app/globals.css`, `src/app/revant-editorial.css`, `src/app/layout.tsx`, `src/content/theme/site-palette.ts`, shared navigation/footer components.
- [x] Define editorial ivory/forest/tangerine tokens while preserving dark mode.
- [x] Redesign desktop/mobile navigation with accessible search and account entry points.
- [x] Add shared surface, form, button, focus and motion primitives; full route-by-route verification remains pending.
- [ ] Confirm all routes still render their shared shell.

### Task 3: Buyer discovery and storefront
**Files:** `src/app/page.tsx`, `src/components/home/HeroCarousel.tsx`, `src/components/products/ProductCard.tsx`, `src/app/shop/[slug]/page.tsx`, category/search views.
- [x] Recompose home using existing real category/product/shop data.
- [x] Remove generic stock-photo fallbacks for shop records; use brand placeholders when media is absent.
- [x] Apply image-led editorial styling to shared product cards; product detail page hierarchy remains pending.
- [x] Upgrade public storefront banner, identity, navigation, product grid and contact hierarchy.

### Task 4: Buyer conversion
**Files:** cart, checkout, confirmation, orders, tracking and support views.
- [x] Apply the first shared editorial styling layer to cart, guest checkout and confirmation; full responsive flow review remains pending.
- [x] Preserve one-order-per-item behavior until a multi-shop transaction contract exists.
- [x] Preserve indicative labels and server-side validation.
- [ ] Improve order history, details, tracking, cancellation, returns and dispute states.

### Task 5: Seller workspace
**Files:** `src/app/compte/boutique/**` and seller shared components.
- [ ] Rebuild seller dashboard around verified operational metrics.
- [ ] Improve order management and catalogue density.
- [ ] Upgrade storefront customization, messaging and social calendar visuals.
- [ ] Preserve permissions and official API constraints.

### Task 6: Courier workspace
**Files:** courier routes/components and delivery incident UI.
- [ ] Redesign mission list and delivery detail for one-hand mobile use.
- [ ] Clarify status progression, proof of delivery and incident reasons.
- [ ] Preserve atomic assignment and server-side transitions.

### Task 7: Shared experiences and Super Admin
**Files:** notification, preference, loyalty, coupon, review, search and `/admin/**` screens.
- [ ] Apply design system to notifications, preferences, loyalty, coupons and reviews.
- [ ] Improve search results and filtering.
- [ ] Redesign Super Admin overview and modules without changing permission boundaries.

### Task 8: Visual and technical verification
- [ ] Map each of the 31 requirements to a route/component and evidence status.
- [ ] Capture mobile, tablet and desktop screenshots for representative and critical flows.
- [ ] Verify light/dark themes, reduced motion, keyboard focus and long-content behavior.
- [ ] Verify iOS simulator and Android build artifacts; compile success is not device validation.
- [ ] Inspect full Git diff, run code review and verify GitHub checks.
- [ ] Keep PR #199 in draft until acceptance criteria are met.

### Task 9: Release readiness (separate gate)
- [ ] Prepare release checklist and rollback plan.
- [ ] Verify Render branch and deployment settings.
- [ ] Do not merge or deploy until evidence is shared and the release checkpoint is authorized.
