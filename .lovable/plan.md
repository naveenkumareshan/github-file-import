

# Fix: Missing Booking ID (Serial Number) in Activity Log

## Problem
All activity log entries show "-" for Booking ID because `serialNumber` is passed as `undefined` when calling `releaseSeat` and `cancelBooking` from `VendorSeats.tsx`. The booking object (`b`) has `serialNumber` available but it's never captured.

## Root Cause
- `VendorSeats.tsx` line 436: `vendorSeatsService.releaseSeat(actionBookingId, undefined, releaseReason)` — hardcoded `undefined`
- `VendorSeats.tsx` line 452: `vendorSeatsService.cancelBooking(actionBookingId, undefined, cancelReason)` — hardcoded `undefined`
- When buttons are clicked, only `b.bookingId` is stored in state, but `b.serialNumber` is not captured

## Fix

### `src/pages/vendor/VendorSeats.tsx`
1. Add `actionSerialNumber` state variable alongside existing `actionBookingId`
2. When cancel/release buttons are clicked, also set `setActionSerialNumber(b.serialNumber)` 
3. Pass `actionSerialNumber` instead of `undefined` in both `releaseSeat` and `cancelBooking` calls
4. Clear `actionSerialNumber` when dialogs close

### Existing data backfill consideration
The 7 existing records have `serial_number = null`. Optionally run a one-time UPDATE to populate them from the `bookings` table using `booking_id`, but this is cosmetic — new entries will be correct going forward.

### Files
- **Edit**: `src/pages/vendor/VendorSeats.tsx` — capture and pass serial number

