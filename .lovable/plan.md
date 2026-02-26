
## Improve Reading Room Booking Page UX

### Changes Overview
1. **Make "Details & Amenities" always open** -- remove the Collapsible wrapper entirely, show description and amenities statically
2. **Shrink "Booking Details" heading** -- reduce from `CardTitle` (large heading) to a smaller, compact label
3. **Remove separate End Date field** -- replace with a small remark under the Start Date showing the calculated end date inline (e.g., "Ends: 25 Mar 2026")
4. **Add seat category filter** -- fetch `seat_categories` for this cabin, display as horizontal filter chips above the seat map, and filter seats by selected category

### Technical Details

**File: `src/pages/BookSeat.tsx`**
- Remove `Collapsible`, `CollapsibleContent`, `CollapsibleTrigger` imports and `detailsOpen` state
- Replace the collapsible section with a static div that always shows description and amenities
- Remove `ChevronUp`/`ChevronDown` imports (no longer needed)

**File: `src/components/seats/SeatBookingForm.tsx`**
- Change `<CardTitle>Booking Details</CardTitle>` to a smaller heading like `<h3 className="text-sm font-semibold">Booking Details</h3>` or remove the CardHeader entirely for a more compact look
- Remove the separate "End Date" block (lines 526-533) and add a small muted text remark below the Start Date button: `"Ends: {format(endDate, 'dd MMM yyyy')}"` 
- Add category filter state and data fetching:
  - Import `seatCategoryService` and fetch categories on mount using `cabin._id || cabin.id`
  - Store `categories` and `selectedCategory` in state
  - Render horizontal category chips (like "All", "Standard", "Premium") between the date section and seat map
  - Pass `selectedCategory` to `DateBasedSeatMap` as a filter prop
- In `DateBasedSeatMap`, add a `categoryFilter` prop and filter `transformedSeats` by category before rendering

**File: `src/components/seats/DateBasedSeatMap.tsx`**
- Add optional `categoryFilter?: string` prop
- Filter `transformedSeats` by `seat.category === categoryFilter` when a filter is active (not "All")

### Files to Modify
- `src/pages/BookSeat.tsx` -- always-open details section
- `src/components/seats/SeatBookingForm.tsx` -- compact heading, inline end date, category filter chips
- `src/components/seats/DateBasedSeatMap.tsx` -- accept and apply category filter
