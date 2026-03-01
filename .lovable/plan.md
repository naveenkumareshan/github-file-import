

# Geo-Based Sponsored Listing System

## Overview
Build a full Sponsored Listings module with Admin control, Partner visibility, and Student-side automatic display. This includes a new database table, admin management UI, partner promotions view, and smart display logic on student listing pages (Hostels + Reading Rooms).

---

## Phase 1: Database Schema

Create a `sponsored_listings` table and a `sponsored_listing_analytics` table.

**`sponsored_listings` table:**
- `id` (uuid, PK)
- `property_type` (text: 'hostel' | 'reading_room')
- `property_id` (uuid) -- references hostel or cabin id
- `partner_id` (uuid) -- references partners table
- `tier` (text: 'featured' | 'inline_sponsored' | 'boost_ranking')
- `target_city_id` (uuid) -- required, references cities
- `target_area_ids` (uuid[]) -- optional multi-select areas
- `start_date` (date)
- `end_date` (date)
- `priority_rank` (integer, default 0)
- `status` (text: 'active' | 'paused' | 'expired', default 'active')
- `created_by` (uuid)
- `created_at`, `updated_at` (timestamptz)

**`sponsored_listing_events` table (analytics):**
- `id` (uuid, PK)
- `sponsored_listing_id` (uuid, FK)
- `event_type` (text: 'impression' | 'click' | 'booking')
- `user_id` (uuid, nullable)
- `created_at` (timestamptz)

**RLS Policies:**
- Admins: full CRUD on both tables
- Partners: SELECT on `sponsored_listings` where `partner_id` matches their partner record; SELECT on `sponsored_listing_events` for their own listings
- Public/Students: SELECT on `sponsored_listings` where `status = 'active'` and `start_date <= now()` and `end_date >= now()`

**Auto-expire trigger:** A database function that sets `status = 'expired'` when `end_date < CURRENT_DATE`.

---

## Phase 2: Admin Panel -- Sponsored Listings Manager

**New file:** `src/components/admin/SponsoredListingsManager.tsx`
**New page:** `src/pages/admin/SponsoredListings.tsx`

Features:
- Table listing all sponsored ads with columns: Property Name, Partner, Tier, City, Areas, Dates, Priority, Status
- Create/Edit dialog with:
  - Property type selector (Hostel / Reading Room)
  - Property dropdown (filtered by type)
  - Partner dropdown (auto-filled from property's owner)
  - Tier selector (Featured / Inline Sponsored / Boost Ranking)
  - City selector (required) + Area multi-select
  - Start Date / End Date pickers
  - Priority Rank input
  - Status toggle (Active / Paused)
- Inline status toggle to pause/activate
- Badge showing expired ads
- Add to AdminSidebar under a "Marketing" or existing section

---

## Phase 3: Partner Panel -- My Promotions

**New file:** `src/pages/partner/MyPromotions.tsx`

Features:
- Card-based list of partner's sponsored listings
- Each card shows: property name, tier badge, target city/areas, date range, remaining days
- Analytics per listing: impressions, clicks, CTR%, bookings generated
- Read-only -- partner cannot activate/create ads
- Add to partner sidebar navigation

---

## Phase 4: Student Display Logic

**Modified files:** `src/pages/Hostels.tsx`, `src/pages/CabinSearch.tsx`

**New hook:** `src/hooks/useSponsoredListings.ts`
- Fetches active sponsored listings for the current city/area context
- Tracks impressions automatically
- Tracks clicks on sponsored cards

**Display ordering logic:**
1. Area-level Featured ads (max 2)
2. City-level Featured ads (max 3)
3. After every 6 organic listings, insert 1 Inline Sponsored card
4. Boosted listings get a ranking score boost
5. Remaining organic listings
6. Max 5 sponsored per page total

**Badges:**
- "Featured" badge (gold/amber) on featured tier cards
- "Sponsored" badge (blue) on inline sponsored cards
- Boosted listings get no visible badge (ranking only)

**Fallback logic:**
- No area ads -> show city-level ads
- No city ads -> organic only

---

## Phase 5: Analytics Tracking

**Event tracking in hook:**
- `impression`: fired when a sponsored card enters the viewport (IntersectionObserver)
- `click`: fired when user taps a sponsored card
- `booking`: tracked at booking confirmation by checking if the property has an active sponsored listing

**Admin analytics view** (in SponsoredListingsManager):
- Per-listing stats: impressions, clicks, CTR%, bookings, revenue
- Aggregate from `sponsored_listing_events` table

---

## Phase 6: Ranking Algorithm

Applied in the display hook before rendering:

```text
finalScore = baseScore
  + (sponsoredWeight * tierMultiplier)
  + (areaMatchPriority * areaBonus)
  + (ratingScore * ratingWeight)
  + (availabilityScore * availabilityWeight)
```

Where:
- `tierMultiplier`: Featured = 100, Inline = 50, Boost = 30
- `areaBonus`: +20 if area matches
- `ratingScore`: average_rating * 5
- `availabilityScore`: has available beds/seats = +10

Sponsored listings influence position but organic high-rated listings can still rank highly.

---

## File Changes Summary

| Action | File |
|--------|------|
| Create | `src/components/admin/SponsoredListingsManager.tsx` |
| Create | `src/pages/admin/SponsoredListings.tsx` |
| Create | `src/pages/partner/MyPromotions.tsx` |
| Create | `src/hooks/useSponsoredListings.ts` |
| Modify | `src/pages/Hostels.tsx` (integrate sponsored display) |
| Modify | `src/pages/CabinSearch.tsx` (integrate sponsored display) |
| Modify | `src/components/admin/AdminSidebar.tsx` (add menu item) |
| Modify | `src/App.tsx` (add routes) |
| DB Migration | Create `sponsored_listings` and `sponsored_listing_events` tables with RLS |
| DB Migration | Create auto-expire function/trigger |

---

## Important Conditions Met

- Ads auto-expire via database trigger
- Max 5 sponsored per page enforced in hook
- Admin has full control (CRUD + status management)
- Partner view is read-only with analytics
- Mobile-responsive card UI with marketplace-style badges
- Geo-targeted by city (required) + area (optional multi-select)
- No SEO disruption (badges are small, no layout shift)

