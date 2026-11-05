# Revant visual reference assets

Approved references supplied by the project owner. Keep Admin and Super Admin identities distinct and do not replace the official marketplace logo.

| Asset | Intended use |
|---|---|
| revant-icon-library-reference.webp | Visual reference for outline icons, navigation and actions |
| revant-admin-app-icon.webp | Admin Android launcher identity |
| revant-super-admin-app-icon.webp | Super Admin Android launcher identity |
| revant-receipt-qr-reference.webp | Receipt layout reference |
| revant-delivery-parcel-reference.webp | Delivery/parcel visual reference |

## Receipt: preserve the supplied mockup design

Reproduce the same visual composition: white rounded card, compact title/header, merchant/order summary, two-column detail rows, item details, separated total, prominent centered QR area, explanatory note, and bottom actions (close/cancel and download). Keep typography, spacing, proportions and visual hierarchy close to the reference.

### Revant receipt fields
- Store name and store logo when available (not third-party transport/reservation details).
- Unique Revant order number and immutable receipt/invoice document number.
- Issue date and order/delivery status.
- Buyer display name only on the authenticated private receipt. Never expose buyer name, phone, or address on public QR verification.
- Purchased item names, quantities, unit prices, subtotal, delivery fee and total in XOF.
- Payment status sourced only from verified payment records. An order or delivery status alone must never imply payment confirmation.
- Unique QR URL for the document. Public verification exposes only document number, document type, issue date and validity/revocation state.

### Permanent requirements
- Official server-side copy tied to the account/order; optional offline local copy.
- Receipts and invoices excluded from cache cleanup and automatic deletion.
- Issued documents are immutable. Corrections are new traceable records/actions, never retroactive edits.
- Download produces a real PDF, not a screenshot.
- Super Admin can search, filter, view and download all documents with server-side finance permission; read-only.
- Public verification never exposes personal or financial secrets.
- Shop QR, official app QR, and receipt/invoice QR are independent systems.

## Status
This document records the approved design contract only. It does not claim binary image uploads, receipt UI/PDF implementation, database migration application, or production deployment are complete.
