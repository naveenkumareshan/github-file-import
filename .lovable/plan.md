

## Reorder Filters, Add Category Step, Simplify Legend & Enhance Bed Tooltips

### 1. Move Room Filter After Floor Tabs (inside Bed Map)

Currently room filter pills are in Step 1 (HostelRoomDetails.tsx). They should appear inside the bed map, right after the floor tabs, since rooms belong to floors.

**File: `src/components/hostels/HostelBedMap.tsx`**
- After the `TabsList` (floor tabs), add a row of room filter pills for the selected floor
- Derive room list from `floorData[selectedFloor]` so only rooms on that floor are shown
- Track selected floor via tab value state
- Remove `roomFilter` prop from being passed from HostelRoomDetails

**File: `src/pages/HostelRoomDetails.tsx`**
- Remove the "Room filter pills" block (lines ~592-622) from Step 1
- Remove `roomFilter` state and `handleRoomFilterChange` if they only serve this purpose, or keep them but let HostelBedMap manage internally

### 2. Add Category Type as a Separate Step (Before Stay Duration)

Currently category pills are inside Step 1 alongside sharing type. Category (AC/Non-AC) should be its own numbered step before Stay Duration.

**File: `src/pages/HostelRoomDetails.tsx`**
- Move category pills out of Step 1 into a new Step 2: "Select Category"
- Renumber: Step 1 = Sharing Type, Step 2 = Category, Step 3 = Stay Duration, Step 4 = Select Bed, Step 5 = Package, Step 6 = Review & Pay
- Category pills show options from `hostel_bed_categories` (already fetched as `categories`)
- Include "All" default option

### 3. Simplify Legend to 3 States Only

Remove "Blocked" from legend. Blocked beds should appear as "Not Available" (same as occupied style).

**File: `src/components/hostels/HostelBedMap.tsx`**
- Remove the "Blocked" legend item (lines 201-204)
- Keep only: Available, Occupied/Not Available, Selected

**File: `src/components/hostels/HostelFloorView.tsx`**
- Change blocked bed styling: instead of `bg-destructive/10 border-destructive/30`, use the same style as occupied (`bg-blue-50 border-blue-400 text-blue-800`)
- Remove the separate `isBlocked` color branch; treat blocked as not-available
- In tooltip text, show "Not Available" instead of "Blocked"

### 4. Enhanced Bed Tooltip with Amenities

**File: `src/components/hostels/HostelFloorView.tsx`**
- Tooltip already shows amenities (line 147-149), but improve the display:
  - Show each amenity as a small badge/chip instead of comma-separated text
  - Show room number, sharing type, category, price, status, and amenities in a structured layout
  - For selected beds, show the same rich info

### Summary of Changes

| Change | File(s) |
|--------|---------|
| Move room filter inside bed map after floor tabs | `HostelBedMap.tsx`, `HostelRoomDetails.tsx` |
| Category as separate step 2 with renumbering | `HostelRoomDetails.tsx` |
| Remove "Blocked" from legend, merge with occupied | `HostelBedMap.tsx`, `HostelFloorView.tsx` |
| Enhanced bed tooltip with amenity badges | `HostelFloorView.tsx` |

