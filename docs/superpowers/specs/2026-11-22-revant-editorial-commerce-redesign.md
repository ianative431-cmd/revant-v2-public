# Revant Editorial Commerce Redesign — Design Specification

## Intent
Create a visibly distinct, premium and commercially effective Revant marketplace while preserving every existing route, user journey, permission, business rule and data contract. Revant should feel like an editorial shopping destination rooted in Niger and regional commerce, not a generic catalogue template.

## Users and outcomes
- Buyers discover real products and active shops, understand price and availability, and complete existing purchase flows confidently.
- Sellers present credible storefronts and manage real catalogues and orders.
- Couriers execute assigned deliveries with clear status, proof and incident states.
- Administrators operate the marketplace through existing permissioned routes.

## Visual direction — Revant Editorial Commerce
- Preserve the official Revant mark and electric tangerine accent.
- Establish a warm mineral-ivory canvas, deep forest/ink structural surfaces and restrained tangerine action accents.
- Use editorial typography, asymmetrical image-led compositions, clear section rhythm and a deliberate mix of open space and dense commerce information.
- Replace generic rounded-card repetition with editorial feature panels, compact product tiles, structured data panels and clear navigation landmarks.
- Use real product/shop media only when it exists in Supabase. When absent, use a designed neutral/brand placeholder, never a fake shop/product photograph.
- Maintain the alternate dark theme with the same identity.
- Respect reduced motion, keyboard navigation, focus visibility, WCAG AA text contrast for orange labels/actions, safe areas and touch targets.

## Scope
All 31 experiences in `docs/REVANT_COMPLETE_VISUAL_DESIGN_SPEC.md` remain in scope. Deliver in coherent vertical slices: shared visual foundation; buyer discovery and storefront; buyer conversion; seller workspace; courier workspace; shared experiences; Super Admin; cross-device verification.

## Non-goals and anti-goals
- Do not remove or rename existing routes to simplify the redesign.
- Do not invent products, shops, ratings, sales, revenue, payments, delivery events or analytics.
- Do not present an indicative subtotal as a server-confirmed total.
- Do not enable product variants until stock reservation, order persistence and cancellation are transactionally supported.
- Do not modify production Supabase data, payment configuration, secrets, Render production or `main` during implementation.
- Do not merge or deploy without final verification and a separate release checkpoint.

## Technical approach
Continue on `feat/revant-complete-visual-system` and PR #199. Reuse Next.js 16.4.6 App Router, React 19.3.1, Tailwind CSS 4, existing CSS variables, Supabase services and current components. Add a small documented layer of design tokens and scoped visual primitives; avoid a competing theme system or unnecessary UI dependencies. Refactor incrementally while preserving server-side data loading, route contracts and actions. Keep sensitive decisions server-authoritative and preserve RLS/authorization boundaries.

## Validation
- Baseline and post-change tests, lint, production dependency audit and production build.
- Map all 31 experiences to concrete routes/components and evidence status.
- Responsive verification at representative phone, tablet and desktop widths.
- Capture real browser screenshots where browser automation is available; otherwise mark device validation pending.
- Inspect Git diff and workflow checks before merge/release.
