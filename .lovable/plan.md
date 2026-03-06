

# Auto-Calculate End Date in Booking Date Edit Dialog

## Current Problem
The dialog lets users manually pick both start and end dates. It should only allow picking the **start date** — the end date must be auto-calculated from the booking's `bookingDuration` (daily/weekly/monthly) and `durationCount`, using the existing `calculateBookingEndDate` utility.

## Changes

### File: `src/components/admin/BookingUpdateDatesDialog.tsx`

1. **Import** `calculateBookingEndDate` from `@/utils/dateCalculations`
2. **Extract** `durationType` and `durationCount` from `booking` prop (e.g., `booking.bookingDuration` / `booking.booking_duration` and `booking.durationCount` / `booking.duration_count`)
3. **Auto-calculate end date** whenever `startDate` changes — use `useEffect` or compute inline:
   ```
   endDate = calculateBookingEndDate(startDate, durationType, durationCount)
   ```
4. **Remove** the end date calendar picker — replace with a read-only display showing the calculated end date
5. **Show booking duration info** (e.g., "1 month" or "3 days") so the partner understands why the end date is what it is
6. **Remove** the `endDate < startDate` validation (no longer needed since end date is computed)

### No other file changes needed
The `booking` object already carries `bookingDuration`/`durationCount` (cabin) or `booking_duration`/`duration_count` (hostel) from the callers in `VendorSeats.tsx` and `HostelBedMap.tsx`.

