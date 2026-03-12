

# Show Universal Package + Subscribe Button in My Subscriptions & Manage Properties

## Problem
1. The universal (Diamond) plan has `is_universal: true` but partners have no UI to subscribe to it. The `openUniversalSubscribe()` function exists in `MySubscriptions.tsx` but is never called from the UI.
2. All subscription orders (including universal) should appear in My Subscriptions table — this already works since the query fetches by `partner_id`.

## Fix

### 1. `src/pages/partner/MySubscriptions.tsx`
- Add a prominent "Universal Package" card/banner above the summary cards (or between summary and filters).
- If no active universal subscription exists, show a "Subscribe to Universal" button that calls `openUniversalSubscribe()`.
- If a universal sub is active, show it as a highlighted card with plan details and expiry.
- The `availablePlans` logic for universal already works — it filters `is_universal` plans when `selectedProperty.type === 'universal'`.

### 2. `src/pages/partner/ManageProperties.tsx`
- Add a small banner/card at the top of the Manage Properties page promoting the universal package.
- "Subscribe to Universal Plan" button links to `/partner/my-subscriptions` (or opens the subscribe dialog inline).
- Only show if no active universal subscription exists (query `property_subscriptions` where `property_type = 'universal'` and `status = 'active'`).

## Files Modified
- `src/pages/partner/MySubscriptions.tsx` — add universal package banner with subscribe CTA
- `src/pages/partner/ManageProperties.tsx` — add universal plan promotion banner

