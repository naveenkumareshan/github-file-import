

## Fix Booking ID Display in Student Booking Details

### Problem
The Booking ID field in the "Booking Info" section shows a raw UUID (e.g., `#da925ed4-b490-...`) instead of the human-readable serial number (e.g., `IS-BOOK-2026-00002`). This happens because some bookings may not have a `serial_number` set, and the fallback displays the raw UUID.

### Changes

**File: `src/pages/students/StudentBookingView.tsx`**

1. **Booking ID row (line 357)**: Change the display logic so that:
   - If `serial_number` exists, show it (e.g., `IS-BOOK-2026-00002`)
   - If not, show a shortened version like `#BOOK-{first 8 chars}` instead of raw UUID slice
   - The header already shows `serial_number` correctly -- make the Booking Info row consistent

2. **Also check**: The `BookingTransactionView` component is still used on the separate `/student/bookings/:bookingId/transactions/:bookingType` route (`BookingTransactions.tsx`). Its line 116 shows `booking.bookingId || booking._id` which are MongoDB field names, not the Supabase `serial_number`. Update that component's Booking ID display to use `serial_number` as well for consistency.

**File: `src/components/booking/BookingTransactionView.tsx`**

- Line 116: Change `#{booking.bookingId || booking._id}` to use `booking.serial_number` first, then fall back to a shortened ID.

### Summary of display logic
```
Booking ID = booking.serial_number || `#${booking.id?.slice(0, 8)}`
```
Both pages will consistently show the serial number when available.
