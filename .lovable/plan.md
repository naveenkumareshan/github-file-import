

# Add "View Plans" Button with Plans Popup — ManageProperties & MySubscriptions

## What
Add a small "View Plans" button next to "Add New Property" in ManageProperties and next to the page title in MySubscriptions. Clicking opens a dialog showing all active subscription plans as comparison cards (read-only, no purchase action — just informational).

## Changes

### 1. `src/pages/partner/ManageProperties.tsx`
- Add state `showPlansDialog`
- Add a "View Plans" button (small, outline) beside "Add New Property" in the header
- Add a Dialog that fetches `subscription_plans` (active, ordered by `display_order`) and renders them as cards showing: name, icon, monthly/yearly price, bed/seat limits, features, discount badge
- Reuse the same plan card layout from MySubscriptions step 1

### 2. `src/pages/partner/MySubscriptions.tsx`
- Add state `showPlansDialog`
- Add a "View Plans" button beside the page title
- Add same Dialog showing all plans as read-only comparison cards
- Plans data already fetched (`plans` query exists)

### Plan Card Layout (shared in both dialogs)
Each card shows:
- Plan icon + name
- Monthly display price + yearly price
- Discount badge if active
- Hostel bed limit / Reading room seat limit
- Feature badges (first 5 + "+N more")
- No select/purchase action — purely informational

## Files Modified
- `src/pages/partner/ManageProperties.tsx`
- `src/pages/partner/MySubscriptions.tsx`

