

# Add Renew Button to Expiring Bookings Pages

## Problem
The expiring bookings pages only have a "View" button. Partners/admins need a "Renew" button directly in the table to quickly extend bookings without navigating away. Renewal should charge only seat price (no locker/deposit).

## Changes

### 1. Update Expiring Bookings Query — `adminBookingsService.ts`
- Add `price` to the seat select: `seats:seat_id(number, floor, price)`
- Add `price` to hostel bed select for hostel expiring: `hostel_beds:bed_id(bed_number, price)`

### 2. Reading Room Expiring Page — `ExpiringBookingsPage.tsx`
- Import `BookingExtensionDialog`
- Add state for `renewBooking` (the selected booking) and dialog open state
- Add a "Renew" button (RotateCcw icon) next to the existing Eye button in each row
- On click, map the Supabase row data to the format `BookingExtensionDialog` expects:
  ```
  booking = {
    _id: booking.id,
    endDate: booking.end_date,
    seatId: { _id: booking.seat_id, price: booking.seats?.price },
    cabinId: { _id: booking.cabin_id }
  }
  ```
- On extension complete, refresh the list
- The dialog already uses only seat price (no deposit/locker) — matches the requirement

### 3. Hostel Expiring Page — `HostelExpiringBookingsPage.tsx`
- Same pattern: add Renew button that navigates to the hostel booking detail page (since `BookingExtensionDialog` is cabin-specific and hostel renewals use a different flow on the booking detail page)

### Files Modified
- `src/api/adminBookingsService.ts` — add `price` to seat/bed select in expiring queries
- `src/pages/admin/ExpiringBookingsPage.tsx` — add Renew button + BookingExtensionDialog integration
- `src/pages/admin/HostelExpiringBookingsPage.tsx` — add Renew button (navigates to booking detail)

