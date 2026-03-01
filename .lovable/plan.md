

## Make Study Rooms and Hostels Card Layouts Consistent

Currently the two listing pages have different card styles:
- **Hostels** (`/hostels`): Compact horizontal cards (small thumbnail on the left, details on the right) -- matches the mobile-first design
- **Study Rooms** (`/cabins`): Large vertical grid cards (big image on top, details below) -- desktop-style, inconsistent on mobile

The fix is to update the **Cabins page** to use the same compact horizontal card layout as Hostels, matching the mobile-first design language used elsewhere.

---

### Changes

**1. `src/pages/Cabins.tsx` - Replace desktop layout with mobile-first layout**

Remove the hero banner section and desktop-style container layout. Replace with the same sticky-header + compact-list pattern used on the Hostels page:
- Sticky header with title and category filter pills
- Compact horizontal card list (thumbnail left, content right)
- Same spacing, typography, and rounded-card style as Hostels

**2. `src/components/cabins/CabinsGrid.tsx` - Rewrite to use horizontal card layout**

Replace the current grid of large `CabinCard` components with inline horizontal cards matching the Hostels pattern:
- Each card: 80x80px thumbnail on left, name/location/amenities/price on right
- Category badge on thumbnail
- Rating or "New" badge
- "Book" action pill on bottom-right
- Uses `Link` to `/book-seat/{serial_number}`
- Responsive: single column on mobile, 2-3 columns on larger screens

**3. No changes to `src/components/CabinCard.tsx`**

The original CabinCard component will be kept as-is since it may be used elsewhere (e.g., admin views). The CabinsGrid will simply stop importing it and render its own inline cards.

### Result

Both Study Rooms and Hostels pages will have:
- Same sticky header pattern
- Same compact horizontal card layout
- Same typography scale (13px names, 11px details, 10px tags)
- Same rounded-2xl card styling with hover effects
- Consistent mobile-first experience

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/Cabins.tsx` | Replace hero banner with sticky header; simplify layout |
| `src/components/cabins/CabinsGrid.tsx` | Replace vertical grid cards with horizontal compact cards matching Hostels |
