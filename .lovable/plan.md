

## Fix Booking View Crash + Per-Floor Layout Images + Seat Boundary Constraints

### Problem 1: StudentBookingView Crash (Blank Screen on "View Details")

**Root Cause**: The `StudentBookingView.tsx` component expects camelCase field names (`startDate`, `endDate`, `bookingDuration`, etc.) but the database returns snake_case (`start_date`, `end_date`, `booking_duration`). When `format(new Date(booking.startDate), ...)` is called at line 190/193, `booking.startDate` is `undefined`, producing `Invalid Date`, which causes the `RangeError: Invalid time value` crash.

**Fix**: Add a data mapping layer in `StudentBookingView.tsx` that transforms the raw Supabase response into the expected `BookingDetail` interface. Map `start_date` to `startDate`, `end_date` to `endDate`, `payment_status` to `paymentStatus`, `booking_duration` to `bookingDuration`, `duration_count` to `durationCount`, `total_price` to `totalPrice`, `cabin_id` to `cabinId`, `seat_number` to `seatNumber`. Also extract joined cabin data from the `cabins` object that Supabase returns via the join query.

**File**: `src/pages/students/StudentBookingView.tsx`

---

### Problem 2: Per-Floor Layout Images and Opacity

**Current State**: The `cabins` table has a single `layout_image` column shared across all floors. There is no per-floor image or opacity setting.

**Solution**: Store per-floor layout images and opacity inside the existing `floors` JSONB column. Each floor object will be extended from `{id, number}` to `{id, number, layout_image, layout_image_opacity}`.

**Database**: No schema migration needed -- the `floors` column is already `jsonb` and can hold arbitrary properties per floor entry.

**Admin Side Changes** (`src/pages/SeatManagement.tsx`):
- When admin switches floors, load that floor's `layout_image` and `layout_image_opacity` from the `floors` JSONB array instead of the cabin-level `layout_image`.
- When admin uploads a layout image via FloorPlanDesigner, save it to the current floor's entry in the JSONB array.
- Add an opacity slider per floor in the FloorPlanDesigner toolbar.
- On save, update the cabin's `floors` JSONB with the per-floor image/opacity data.

**Student Side Changes** (`src/components/seats/DateBasedSeatMap.tsx` and `src/pages/BookSeat.tsx`):
- When a student switches floors, read the floor-specific `layout_image` and `layout_image_opacity` from the cabin's `floors` JSONB.
- Pass the floor-specific opacity to `FloorPlanViewer` instead of hardcoding `100`.

**Files**:
- `src/pages/SeatManagement.tsx` -- load/save per-floor images in floors JSONB
- `src/components/seats/DateBasedSeatMap.tsx` -- accept floors data, extract per-floor image/opacity on floor switch
- `src/pages/BookSeat.tsx` -- pass full floors data to SeatBookingForm/DateBasedSeatMap
- `src/components/seats/SeatBookingForm.tsx` -- forward floors data to DateBasedSeatMap
- `src/api/adminCabinsService.ts` -- update `updateCabinLayout` to save per-floor images in the floors JSONB

---

### Problem 3: Constrain Seats Within Image Boundaries

**Current State**: The FloorPlanDesigner allows placing seats anywhere on the canvas, even outside the uploaded image area. The image uses `object-contain` so it may not fill the full canvas dimensions.

**Solution**: When placing or dragging seats in `FloorPlanDesigner.tsx`, clamp seat positions to stay within `(0, 0)` to `(roomWidth, roomHeight)`. Since the background image is set to `object-contain` and fills the full room dimensions canvas, constraining to canvas bounds effectively constrains to the image. The existing `snapToGrid` function will be augmented with boundary clamping.

Additionally, ensure the `FloorPlanViewer.tsx` (student view) renders the same image with the same positioning so students see the identical layout.

**Files**:
- `src/components/seats/FloorPlanDesigner.tsx` -- add boundary clamping when placing/dragging seats

---

### Technical Summary

| Change | Files |
|---|---|
| Fix StudentBookingView crash (snake_case to camelCase mapping) | `src/pages/students/StudentBookingView.tsx` |
| Per-floor layout images and opacity in floors JSONB | `src/pages/SeatManagement.tsx`, `src/components/seats/DateBasedSeatMap.tsx`, `src/pages/BookSeat.tsx`, `src/components/seats/SeatBookingForm.tsx`, `src/api/adminCabinsService.ts` |
| Constrain seats within image boundaries | `src/components/seats/FloorPlanDesigner.tsx` |

No database migration is needed -- the existing `floors` JSONB column accommodates the new per-floor properties.

