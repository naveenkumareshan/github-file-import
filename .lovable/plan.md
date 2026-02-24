

## Fix Booking Confirmation + Add Invoice Download — COMPLETED

### What was done:

1. **DB Migration**: Made `generate_serial_number` function SECURITY DEFINER, added `bookings_user_id_fkey` FK from bookings to profiles
2. **Fixed booking queries**: Updated all `profiles:user_id(...)` to `profiles!bookings_user_id_fkey(...)` in `adminBookingsService.ts` and `vendorSeatsService.ts`
3. **Invoice feature**: Added post-booking success view with full details + "Download Invoice" button that opens a print-ready HTML invoice
4. **Seat price read-only**: Already done in prior step
