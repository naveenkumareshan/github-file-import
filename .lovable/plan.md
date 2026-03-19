

## Plan: Unified Marketplace Design System for Student Pages

### Problem
All 4 student-facing listing pages (Reading Rooms, Hostels, Mess, Laundry) have nearly identical layouts but each implements its own inline card markup, header, filters, loading skeletons, and empty states -- creating visual inconsistency and code duplication.

### Solution
Create a shared component library and refactor all 4 pages to use them.

---

### New Files to Create

**1. `src/components/marketplace/MarketplaceCard.tsx`** -- Single reusable card component

```text
┌──────────────────────────────────────────────┐
│ ┌────────┐  Name                    ❤️ 📞 📍 │
│ │        │  ⭐ 4.2 (128) · 2km away          │
│ │ IMAGE  │  [WiFi] [AC] [Food] +2            │
│ │ [BADGE]│  ₹2,500/mo    5 seats left        │
│ └────────┘              [Book Now ▸]          │
└──────────────────────────────────────────────┘
```

Props interface:
- `image`, `name`, `location`, `rating`, `reviewCount`
- `tags` (amenities/features array)
- `price`, `priceLabel` (e.g. "/mo", "/kg")
- `availability` (e.g. "5 seats left")
- `badge` ("Top Rated" | "New" | "Most Booked" | food type | gender | category)
- `badgeColor` (amber/green/blue/purple)
- `ctaLabel` ("Book Now" | "View Rooms" | "View Menu" | "View")
- `onClick`, `onSave`, `onCall`, `onMap`
- `sponsoredTier` (for hostel sponsored listings)

Design:
- Rounded-2xl card with soft shadow (`shadow-sm hover:shadow-md`)
- Left image 96x96 with badge overlay
- Quick action icons (heart, phone, map pin) top-right
- Consistent 13px name, 11px meta, 10px tags typography
- Green highlight for price, primary color CTA button
- Mobile-first: horizontal card; `md:` vertical card option

**2. `src/components/marketplace/MarketplaceHeader.tsx`** -- Reusable sticky header

Props:
- `title` (string)
- `searchPlaceholder` (string)
- `searchQuery`, `onSearchChange`
- `filters` (array of `{id, label, icon?}`)
- `activeFilter`, `onFilterChange`

Contains: search bar + filter chips in consistent layout.

**3. `src/components/marketplace/MarketplaceSkeleton.tsx`** -- Reusable loading skeleton

Extracts the repeated 4-card pulse skeleton used identically across all pages.

**4. `src/components/marketplace/MarketplaceEmpty.tsx`** -- Reusable empty state

Props: `icon`, `title`, `subtitle`, `ctaLabel?`, `ctaTo?`
- Friendly illustration with optional "Become a Partner" CTA button

---

### Files to Modify

**5. `src/pages/Cabins.tsx`** -- Refactor to use shared components
- Replace inline header with `<MarketplaceHeader>`
- Replace `<CabinsGrid>` with `<MarketplaceCard>` mapping
- Use `<MarketplaceSkeleton>` and `<MarketplaceEmpty>`
- Map cabin data to MarketplaceCard props (badge = category, tags = amenities, cta = "Book Now")

**6. `src/pages/Hostels.tsx`** -- Refactor to use shared components
- Replace inline header/cards with shared components
- Map hostel data: badge = gender, tags = amenities, price from starting_price, cta = "View Rooms"
- Preserve sponsored listing logic (pass `sponsoredTier` prop)

**7. `src/pages/MessMarketplace.tsx`** -- Refactor to use shared components
- Map mess data: badge = food type (VEG/NON/MIX with color), tags from description, cta = "View Menu"

**8. `src/pages/Laundry.tsx`** -- Refactor to use shared components
- Map laundry data: tags = delivery time + operating hours, cta = "View"

**9. `src/components/cabins/CabinsGrid.tsx`** -- Remove (no longer needed, logic moves into Cabins.tsx)

---

### Design Rules

- **Card radius**: `rounded-2xl` (16px)
- **Shadows**: `shadow-sm` default, `shadow-md` on hover
- **Typography**: Name 13px semibold, location 11px, tags 10px, price 12px semibold green
- **Colors**: Blue = primary CTA, Purple badge = premium/luxury, Green badge = new/available, Amber = top rated
- **Spacing**: `gap-4` between cards, `p-3` card padding
- **Quick actions**: Heart (save), Phone (call), MapPin (directions) -- shown on hover/always on mobile
- **Badges**: Absolute positioned on image -- "Top Rated", "New", "Most Booked", category/gender/food type
- **Responsive**: Mobile = horizontal card (image left); Desktop grid = 3 columns

### What Stays the Same
- All existing data fetching logic, API calls, and filtering logic in each page
- Route paths and navigation targets
- Sponsored listing tracking in Hostels

