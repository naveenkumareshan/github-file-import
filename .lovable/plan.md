

## Remove Availability from Seat Editor + Enforce Minimum Category Price

### Changes Overview

**1. Remove "Available" toggle from Seat Edit Dialog (FloorPlanDesigner.tsx)**

The `SeatEditDialog` component (lines 498-578) currently has an "Available" switch that lets admins toggle seat availability. This will be removed -- availability should only be managed from the separate "Seat Availability Map" in the sidebar.

- Remove the `isAvailable` state variable (line 513)
- Remove the `isAvailable` initialization in useEffect (line 519)
- Remove the "Available" Switch UI (lines 559-562)
- Remove `isAvailable` from the `onConfirm` call (line 572)
- Update `handleEditConfirm` to not pass `isAvailable`

Also remove the `isAvailable` field from the `handlePlaceSeat` function in `SeatManagement.tsx` (line 153) -- new seats should default to `true` via the database default, not be set manually during creation.

**2. Enforce minimum price = cabin's starting price in Category Management + Seat Edit**

The cabin's `price` field (labeled "Starting Price" in the editor) represents the minimum allowed price. Category prices and individual seat prices must not go below this.

**File: `src/pages/SeatManagement.tsx`**
- In `handleSaveCategory` (line 208), validate that `catPrice >= cabin.price`. Show a toast error if below.
- In the Category dialog price input (line 358), set `min={cabin?.price || 0}`.

**File: `src/components/seats/FloorPlanDesigner.tsx`**
- Add a `minPrice` prop to `FloorPlanDesigner`, `SeatPlacementDialog`, and `SeatEditDialog`.
- In `SeatPlacementDialog`, set the price input `min` to `minPrice` and validate on confirm.
- In `SeatEditDialog`, set the price input `min` to `minPrice` and validate on confirm.
- In `SeatManagement.tsx`, pass `minPrice={cabin?.price || 0}` to `FloorPlanDesigner`.

---

### Technical Summary

| File | Change |
|------|--------|
| `src/components/seats/FloorPlanDesigner.tsx` | Remove "Available" toggle from `SeatEditDialog`; add `minPrice` prop to enforce floor price on both placement and edit dialogs |
| `src/pages/SeatManagement.tsx` | Pass `minPrice` to `FloorPlanDesigner`; validate category price >= cabin starting price in save handler |

