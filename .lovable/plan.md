

## Redesign Hostel Booking Flow to Match Reading Room Pattern

### Current Problem
The hostel detail page shows sharing options as selectable cards, then packages, then a "Book Now" that navigates away. There's no bed-level selection from the student side -- students just pick a sharing type and go. The admin bed map is read-only.

### New Flow (Matching Reading Room)

**Student Booking Flow (HostelRoomDetails.tsx):**
1. Hero image slider + hostel info + chips (keep as-is -- already matches BookSeat)
2. **Step 1: Select Sharing Type** -- Category/sharing filter pills (like seat category filter in reading rooms): "All", "Single", "2-Sharing", "3-Sharing", etc. Also AC/Non-AC filter if room categories exist
3. **Step 2: Select Your Bed** -- Inline bed map (not in a dialog) showing floor tabs with room sections and clickable beds. Beds filtered by selected sharing type. Non-matching beds shown as disabled (same as reading room category mismatch pattern). Student clicks a bed to select it
4. **Step 3: Choose Stay Duration** -- StayDurationPackages shown after bed is selected (same as current, but triggered by bed selection instead of sharing option selection)
5. **Step 4: Review and Pay** -- Sticky bottom bar with selected bed info + "Book Now" button (matching BookSeat's sticky bottom bar)
6. Hero collapses when bed is selected (same IntersectionObserver pattern)

**Admin/Partner Bed Map Editor:**
Create a new `HostelBedMapEditor` component (similar to FloorPlanDesigner) where admins can:
- Add/remove beds visually per room
- Set bed category (AC/Non-AC) and price per bed
- Assign sharing type per bed
- Block/unblock beds
- View occupancy

### Database Changes

**Add columns to `hostel_beds` table:**
- `category` (text, nullable) -- e.g. "AC", "Non-AC", default null
- `price_override` (numeric, nullable) -- per-bed price override (if null, uses sharing option price)

**New table: `hostel_bed_categories`** (mirrors `seat_categories`)
- `id` (uuid PK)
- `hostel_id` (uuid FK -> hostels)
- `name` (text) -- e.g. "AC", "Non-AC"
- `price_adjustment` (numeric, default 0) -- price modifier
- `created_at` (timestamptz)

RLS: Admin full, partner own hostels, public read.

---

### Files to Change

| File | Action | Description |
|---|---|---|
| DB migration | New | Add `category` and `price_override` to `hostel_beds`; create `hostel_bed_categories` table |
| `src/api/hostelBedCategoryService.ts` | New | CRUD for bed categories (mirrors seatCategoryService) |
| `src/components/hostels/HostelBedMapEditor.tsx` | New | Admin visual bed editor: add/edit/block beds with category and price per bed |
| `src/components/hostels/HostelBedMap.tsx` | Edit | Add `sharingFilter` and `categoryFilter` props to filter beds; make `onBedSelect` work for student selection |
| `src/components/hostels/HostelFloorView.tsx` | Edit | Support category display on bed markers; show disabled state for filtered-out beds |
| `src/pages/HostelRoomDetails.tsx` | Rewrite | New stepped flow: sharing filter pills -> inline bed map -> packages -> sticky bottom bar |
| `src/components/hostels/RoomBedManagement.tsx` | Edit | Replace read-only bed map tab with the new `HostelBedMapEditor` |
| `src/pages/HostelBooking.tsx` | Edit | Accept selected bed from navigation state; show bed number in summary |

---

### Student Page Layout (HostelRoomDetails.tsx)

```text
+----------------------------------+
| [Hero Image Slider]              |  <- collapses on bed select
| Hostel Name, Rating, Location    |
| [Info Chips Row]                 |
| [Details & Amenities]            |
+----------------------------------+
| Step 1: Filter                   |
| [All] [Single] [2-Share] [3-Sh] |  <- sharing type pills
| [All] [AC] [Non-AC]             |  <- category pills (if categories exist)
+----------------------------------+
| Step 2: Select Your Bed          |
| [Floor 1] [Floor 2] tabs         |
|  Room 101 [Standard]             |
|  [B1] [B2] [B3] [B4] ...        |  <- clickable bed grid
|  Room 201 [Premium]              |
|  [B1] [B2] [B3] ...             |
+----------------------------------+
| Step 3: Stay Duration            |  <- appears after bed selected
| [Base] [3mo+] [6mo+] [11mo+]    |
+----------------------------------+
| [Sticky Bottom Bar]              |
| Bed #3 | 2-Sharing | Rs8500/mo   |
|                    [Book Now]     |
+----------------------------------+
```

### Admin Bed Map Editor (HostelBedMapEditor.tsx)

- Same floor/room grid layout as HostelBedMap
- Each bed is editable: click to open a popover/dialog with fields for category, price override, sharing type, block/unblock
- "Add Bed" button per room to create new beds
- Bulk operations: "Add X beds to sharing option Y"
- Category management section at the top (add/edit/delete categories like AC/Non-AC)

### Technical Notes

- Bed map is inline on the student page (not in a dialog) -- same as how `DateBasedSeatMap` is inline in `SeatBookingForm`
- The sharing type filter works like the category filter in reading rooms: non-matching beds are shown but disabled/greyed out
- `price_override` on a bed takes precedence over the sharing option's `price_monthly` when calculating booking price
- Stay packages discount is applied to the bed's effective price (override or sharing option price)
- The `hostel_bed_categories` table is hostel-level (like `seat_categories` is cabin-level)
