

# Fix: Show All 180 Generated Seats + Add Reset Button

## Root Cause

`handleAutoGenerate` calls `onPlaceSeat` (→ `handlePlaceSeat`) individually for each seat. Each call makes a **separate API request** to insert one row. With 180 seats, that's 180 concurrent API calls — many fail silently due to rate limiting or connection exhaustion. A `bulkCreateSeats` method already exists in `adminSeatsService` but isn't being used.

## Fix

### 1. Add bulk placement handler in `SeatManagement.tsx`
- Add a new `handleBulkPlaceSeats` function that accepts an array of generated seats
- Uses `adminSeatsService.bulkCreateSeats()` (single INSERT with 180 rows) instead of 180 individual calls
- After success, appends all returned seats to state at once

### 2. Add `onBulkPlaceSeats` prop to `FloorPlanDesigner`
- New optional prop: `onBulkPlaceSeats?: (seats: Array<{position, number, price, category}>) => Promise<void>`
- In `handleAutoGenerate`, if `onBulkPlaceSeats` is provided, collect all valid seats and call it once instead of looping `onPlaceSeat`

### 3. Add "Reset Layout" button to toolbar
- Add a "Reset Layout" button in `FloorPlanDesigner.tsx` toolbar that rearranges all existing seats into a clean grid pattern (sorted by seat number, placed in rows with aisle gaps)
- This re-positions seats in-place and calls `onSeatMove` for each, or better, a bulk position update

### 4. Add bulk move handler in `SeatManagement.tsx`
- Use existing `adminSeatsService.updateSeatPositions()` to persist all repositioned seats after reset

## Files to Change

| File | Change |
|------|--------|
| `src/pages/SeatManagement.tsx` | Add `handleBulkPlaceSeats` using `bulkCreateSeats`, pass as prop |
| `src/components/seats/FloorPlanDesigner.tsx` | Add `onBulkPlaceSeats` prop, use in `handleAutoGenerate`; add "Reset Layout" button that re-grids all seats |

