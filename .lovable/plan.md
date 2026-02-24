

## Fix Reading Room Status Management, Student Display, and Mobile BookSeat UI

### Problem Summary

1. **Status toggles broken**: The `handleToggleActive` and `onToggleBooking` in `RoomManagement.tsx` call `adminRoomsService.restoreRoom()` which uses **axios to a dead MongoDB backend** (localhost:5000). This causes "Failed to activate room status" errors.
2. **Missing `is_booking_active` column**: The `cabins` database table has no `is_booking_active` column, so even if the service worked, there's nowhere to store the booking-enabled/paused state.
3. **Student-facing rooms not filtering correctly**: `cabinsService.getAllCabins()` filters by `is_active = true` but doesn't account for the booking status. Students can see rooms but the booking form reads `isBookingActive` from a field that doesn't exist in the DB.
4. **BookSeat page is desktop-styled**: The `/book-seat/:cabinId` page uses large Cards, desktop layouts, and doesn't show seat category details (AC/Non-AC) when a seat is selected. It needs a proper mobile-first redesign.

---

### Status Logic Design

Three states for each reading room:

| Status | `is_active` | `is_booking_active` | Visible to Students? | Can Book? |
|--------|-------------|--------------------|-----------------------|-----------|
| Deactivated | false | false | No | No |
| Activated (Paused) | true | false | Yes (shown) | No ("Bookings paused" message) |
| Activated (Enabled) | true | true | Yes (shown) | Yes |

- **Activate/Deactivate** toggles `is_active`. Deactivating also sets `is_booking_active = false`.
- **Enable/Pause Booking** toggles `is_booking_active` (only available when `is_active = true`).

---

### Changes

#### 1. Database Migration -- Add `is_booking_active` column

```sql
ALTER TABLE public.cabins
  ADD COLUMN IF NOT EXISTS is_booking_active boolean NOT NULL DEFAULT true;
```

#### 2. Rewrite `adminRoomsService.ts` to use Supabase

Replace the axios-based service with direct Supabase calls:

- `toggleRoomActive(id, isActive)` -- updates `is_active` (and sets `is_booking_active = false` when deactivating)
- `toggleBookingActive(id, isBookingActive)` -- updates `is_booking_active`

Remove all old axios-based methods.

#### 3. Fix `RoomManagement.tsx` status handlers

- `handleToggleActive`: Call the new `toggleRoomActive`, then refresh cabins list
- `onToggleBooking`: Call the new `toggleBookingActive`, then refresh cabins list
- Fix toast messages (currently says "deactivated" when activating and vice versa)

#### 4. Fix `adminCabinsService.ts` to handle `is_booking_active`

- In `updateCabin`, map `isBookingActive` to `is_booking_active`
- In `getAllCabins`, return `is_booking_active` alongside `is_active`

#### 5. Fix student-facing cabin queries

- `cabinsService.getAllCabins()` already filters `is_active = true` -- this is correct
- In `BookSeat.tsx`, map `is_booking_active` from DB to `isBookingActive` on the cabin object (currently hardcodes from `is_active`)
- In `SeatBookingForm.tsx`, the booking-disabled alert already checks `cabin.isBookingActive` -- this will now work correctly

#### 6. Redesign `BookSeat.tsx` for mobile-first layout

Current issues: Desktop card layout, no seat category info shown, CabinDetails uses side-by-side layout on mobile.

New mobile design:
- **Hero image** at top (full-width, edge-to-edge, with gradient overlay and cabin name/category badge)
- **Compact info chips** below image: price, capacity, category -- as horizontal scrollable pills
- **Collapsible details section** (amenities, description) -- collapsed by default on mobile
- **When seat selected**: Show a **bottom sheet / sticky bottom card** with seat details (number, category like "AC" or "Non-AC", price) and "Proceed to Book" button
- Remove the separate `CabinDetails` component from this page and inline a compact mobile version

#### 7. Show seat category in FloorPlanViewer tooltip and selection

- The tooltip already shows `seat.category` -- this works
- Add category display in the selected-seat summary area within `SeatBookingForm.tsx` (show "Seat #5 - AC - Rs 3000/mo" instead of just "Seat #5")

---

### Technical Details

**Files to modify:**

| File | Changes |
|---|---|
| Database migration | Add `is_booking_active` boolean column |
| `src/api/adminRoomsService.ts` | Rewrite entirely: replace axios with Supabase SDK calls for `toggleRoomActive()` and `toggleBookingActive()` |
| `src/pages/RoomManagement.tsx` | Fix `handleToggleActive` and `onToggleBooking` to use new Supabase service, fix inverted toast messages, refresh list after toggle |
| `src/api/adminCabinsService.ts` | Add `is_booking_active` mapping in `updateCabin` and `createCabin` |
| `src/pages/BookSeat.tsx` | Map `is_booking_active` to `isBookingActive`, redesign with mobile-first hero image layout, collapsible details, sticky bottom seat info card |
| `src/components/CabinDetails.tsx` | Minor: ensure mobile layout uses vertical stacking |
| `src/components/seats/SeatBookingForm.tsx` | Show seat category (AC/Non-AC) in booking summary, show category in selected seat display |
| `src/components/admin/CabinItem.tsx` | Disable "Enable/Pause" button when room is inactive |

**Seat selection bottom card (mobile) example layout:**
```text
+------------------------------------------+
| Seat #5  |  AC  |  Rs 3,000/mo           |
|          [ Proceed to Book ]             |
+------------------------------------------+
```

This card appears as a sticky element at the bottom of the viewport when a seat is tapped in the FloorPlanViewer.

