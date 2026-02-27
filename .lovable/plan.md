

## Show Seat Category, Time Slot, and Duration on Admin Bookings List

### Problem
The admin bookings table (`/admin/bookings`) doesn't display seat category, time slot, or booking duration. The data exists in the database (`bookings.slot_id`, `bookings.booking_duration`, `bookings.duration_count`, `seats.category`) but isn't fetched or rendered.

### Fix

**File: `src/api/adminBookingsService.ts`**

1. Update the `getAllBookings` select query (line 27) to also fetch:
   - `slot_id` and `booking_duration` and `duration_count` from bookings (already in the row, just not mapped)
   - `category` from the seats join: change `seats:seat_id(number)` to `seats:seat_id(number, category)`
   - Join `cabin_slots:slot_id(name)` to get the slot name

2. Update the mapping (lines 63-91) to include:
   - `bookingDuration` from `b.booking_duration`
   - `durationCount` from `b.duration_count`
   - `seatCategory` from `seat?.category`
   - `slotName` from `cabin_slots?.name` (or "Full Day" if `slot_id` is null)

**File: `src/pages/AdminBookings.tsx`**

1. Add two new columns to the table header: replace `"Type"` with `"Category"` and add `"Slot"` column, or add them alongside existing columns.
2. In each row, render:
   - **Category**: badge showing `b.seatCategory` (e.g., "AC", "Non-AC")
   - **Slot**: text showing `b.slotName` (e.g., "Morning", "Full Day")
   - **Duration**: already has a "Duration" column showing date range; update it to also show duration type (e.g., "1 Month" instead of just the date range)
3. Update header array and colSpan for loading/empty states.

### Summary

| File | Changes |
|------|---------|
| `src/api/adminBookingsService.ts` | Fetch `seats.category`, join `cabin_slots` for slot name, map `seatCategory`, `slotName`, `bookingDuration`, `durationCount` |
| `src/pages/AdminBookings.tsx` | Add Category and Slot columns; show duration type label in Duration column |

