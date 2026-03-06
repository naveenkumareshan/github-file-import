

# Check: Booking Date Edit — Issues Found

After reviewing the `BookingUpdateDatesDialog` component and how it's used in both `VendorSeats.tsx` (Reading Room) and `HostelBedMap.tsx` (Hostel), here are the issues:

## Issues Found

### 1. No Overlap Validation (Critical)
The dialog updates `start_date` and `end_date` directly without checking if the new dates conflict with other bookings on the same seat or bed. A partner could accidentally create overlapping bookings.

**Fix:** Before updating, query existing bookings on the same `seat_id` (cabin) or `bed_id` (hostel) that overlap with the new date range, excluding the current booking.

### 2. No Start Date < End Date Validation
Nothing prevents selecting an end date before the start date, which would create an invalid booking record.

**Fix:** Disable calendar dates before `startDate` in the end date picker, and add a guard in the submit handler.

### 3. Remarks Field Not Saved
The `remarks` textarea is rendered and state is tracked, but `remarks` is never included in the `updateData` object sent to the database.

**Fix:** This is cosmetic — the `bookings` table doesn't have a `remarks` column. Either remove the field or keep it as a no-op. Removing is cleaner.

### 4. Dues `proportional_end_date` Not Synced
When dates are edited on a booking with `advance_paid` status and a linked `dues` record, the `proportional_end_date` on the due should be updated to match the new `end_date`.

**Fix:** After updating the booking dates, also update any linked `dues` (or `hostel_dues`) record's `proportional_end_date` to the new end date.

### 5. Hostel `is_available` Flag Not Synced
The `hostel_beds` table has an `is_available` flag managed by triggers on `hostel_bookings`. Changing dates may affect whether the bed should be available for the original or new date range, but the trigger only fires on INSERT/UPDATE of status — not date changes. This should be fine since the trigger likely fires on any UPDATE to `hostel_bookings`.

---

## Plan

### File: `src/components/admin/BookingUpdateDatesDialog.tsx`

1. **Add overlap validation** before saving:
   - For `cabin` type: query `bookings` where `seat_id` matches AND dates overlap AND `id != bookingId` AND `payment_status` in `['completed', 'advance_paid']`
   - For `hostel` type: query `hostel_bookings` where `bed_id` matches AND dates overlap AND `id != bookingId` AND `status` in `['confirmed', 'pending']`
   - Need to pass `seatId` / `bedId` into the dialog props

2. **Add end date validation**: disable dates before `startDate` in the end date calendar; block submit if `endDate < startDate`

3. **Remove the unused remarks field** (no DB column to store it)

4. **Sync dues on date change**: after successful booking update, update `dues.proportional_end_date` (cabin) or `hostel_dues.proportional_end_date` (hostel) to new end date

### Files: `src/pages/vendor/VendorSeats.tsx` and `src/pages/admin/HostelBedMap.tsx`

5. **Pass `seatId` / `bedId`** to the dialog so overlap validation can work. Currently `setDateEditBooking({ ...b, id: b.bookingId })` — the booking detail object `b` already contains `seatId` (VendorSeats) or `bedId` (HostelBedMap), so we just need to forward it.

## Files Changed
- `src/components/admin/BookingUpdateDatesDialog.tsx` — overlap check, date validation, dues sync, remove remarks
- `src/pages/vendor/VendorSeats.tsx` — pass seatId in dateEditBooking
- `src/pages/admin/HostelBedMap.tsx` — pass bedId in dateEditBooking

