

# Fix: Booking-Wise Actions Actually Working

## Issues Found

### 1. BookingUpdateDatesDialog uses dead Express API (CRITICAL)
`BookingUpdateDatesDialog` calls `adminManualBookingService.updateBookingData()` which uses `axios` hitting `localhost:5000/api`. The Express backend was removed — this is a purely Supabase project. **Every "Edit Dates" click will fail silently or throw a network error.**

**Fix**: Rewrite the dialog to update dates directly via Supabase:
- For `bookingType === 'cabin'`: update `bookings` table (`start_date`, `end_date`)
- For `bookingType === 'hostel'`: update `hostel_bookings` table (`start_date`, `end_date`)
- Remove the axios-based `adminManualBookingService` dependency entirely from this dialog

### 2. Calendar `selected` prop is wrong in BookingUpdateDatesDialog
Lines 166 and 194: `selected={booking.startDate}` and `selected={booking.endDate}` pass raw strings from the booking object instead of the state variables `startDate` and `endDate`. The calendar won't highlight the currently selected date.

**Fix**: Change to `selected={startDate}` and `selected={endDate}`.

### 3. `format(newEndDate, 'PPP')` crashes when newEndDate is undefined
Line 95: `newEndDate` can be undefined, causing `format()` to throw.

**Fix**: Use `endDate` (the state variable that's always a Date) instead of the unused `newEndDate`.

### 4. Hostel bed transfer doesn't check for overlapping bookings
The reading room transfer (`vendorSeatsService.transferBooking`) checks for date overlaps on the target seat. The hostel transfer (line 501-504 in HostelBedMap) just blindly updates `bed_id` without checking if the target bed already has a booking for those dates.

**Fix**: Add overlap check query before updating hostel booking's bed_id.

### 5. Due collection userId bug in HostelBedMap
Line 528: `user_id: selectedBed.currentBooking?.userId || ''` — when collecting dues for a future booking, this references the current booking's userId, not the future booking's. Also, an empty string for a UUID column will cause a database error.

**Fix**: Pass the specific booking's userId from the `allBookings` array being iterated.

### 6. Unused/dead code cleanup in BookingUpdateDatesDialog
- `newEndDate`, `additionalAmount`, `selectedDuration`, `calculateNewEndDate`, `calculateAdditionalAmount` are unused state/functions
- `transactionService` import is unused
- Duplicate display of current start/end dates (static text + calendar pickers)

**Fix**: Remove unused state, imports, and the duplicate static date display.

## Files Changed

- **`src/components/admin/BookingUpdateDatesDialog.tsx`** — Rewrite to use Supabase directly instead of dead axios API; fix calendar selected props; remove unused code; fix format crash
- **`src/pages/admin/HostelBedMap.tsx`** — Add booking overlap check in transfer; fix due collection userId
- **`src/pages/vendor/VendorSeats.tsx`** — No changes needed (release/cancel/transfer already work via Supabase)

