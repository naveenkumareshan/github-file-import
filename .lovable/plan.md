
Diagnosis (what is actually broken)
- You are right: the student marketplace is still inconsistent.
- I verified runtime pages:
  - `/cabins` = full-width vertical list cards.
  - `/hostels`, `/mess`, `/laundry` = desktop grid cards (3 columns on large screens).
- This mismatch comes from different list containers in each page (`space-y` vs `grid`), not from missing data.
- Also, required quick actions (Save/Call/Map) are mostly not wired, and top chips are not unified (each page uses different chip logic).

Implementation plan to fix it fully

1) Enforce one shared listing layout pattern (all categories)
- Keep a single card orientation everywhere: horizontal card (left image, right content).
- Replace all page-level grid wrappers with one consistent list wrapper (`space-y-2.5`) so Reading Rooms, Hostels, Mess, Laundry render identically on desktop and mobile.
- Files: `CabinSearchResults.tsx`, `Hostels.tsx`, `MessMarketplace.tsx`, `Laundry.tsx`.

2) Standardize top section across all pages
- Update `MarketplaceHeader` to support:
  - common chips: `All`, `Nearby`, `Popular`, `Budget`
  - filter button action slot (for advanced/service-specific filters)
- Keep category-specific filtering inside filter panel/drawer, not in primary chip row.
- Files: `MarketplaceHeader.tsx`, `CabinSearch.tsx`, `Hostels.tsx`, `MessMarketplace.tsx`, `Laundry.tsx`.

3) Make quick actions truly reusable and visible
- In `MarketplaceCard`, show quick actions consistently (not hover-only on desktop).
- Wire handlers from each page:
  - Save (local bookmark state for now),
  - Call (`tel:` when phone exists),
  - Map (open Google Maps query from coordinates/address).
- Files: `MarketplaceCard.tsx` + all 4 listing pages (data mapping per category).

4) Normalize card content mapping per category
- Reading Rooms: name, rating/count, area+city, amenities, monthly price, seats left (if available), CTA “Book Now”.
- Hostels: same structure; remove overlapping extra content issue in bottom row; CTA “View Rooms”.
- Mess: same structure; food badge + package/starting price; CTA “View Menu”.
- Laundry: same structure; service area + delivery/ops tags; CTA “View Details”.

5) Unify empty/loading states
- Use one empty pattern with friendly illustration + CTA “Become a Partner”.
- Use same skeleton count/spacing across all pages.
- Files: `MarketplaceEmpty.tsx`, `MarketplaceSkeleton.tsx`, all 4 listing pages.

6) Final visual QA (so you don’t burn more credits)
- Validate in preview on:
  - `/cabins`, `/hostels`, `/mess`, `/laundry`
  - desktop (1106x720) and mobile viewport
- Confirm:
  - identical card/list structure,
  - same header behavior/chips,
  - no text overlap,
  - quick actions visible and working.

Technical details
- No backend/database changes required.
- This is a frontend-only refactor: shared component behavior + page-level mapping cleanup.
- Main root-cause fix is replacing mixed `grid`/`list` containers with one unified listing container and one shared header behavior.
