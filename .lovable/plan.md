

## Plan: Check Seat Availability Before Renewal of Expired Bookings

### Problem
When a booking has expired, the seat may have been reassigned to another student. Currently, clicking "Renew" opens the renewal sheet without checking if the seat is still available, which could lead to double-booking conflicts.

### Solution
Add a seat availability check in `ExpiringBookingsPage.tsx` before opening the RenewalSheet. Use the existing `check_seat_available` RPC function to verify the seat is free for the renewal period. If the seat is taken, show a toast error instead of opening the sheet.

### Changes

**`src/pages/admin/ExpiringBookingsPage.tsx`** — `handleRenew` function (line 86-105)
- Before opening the renewal sheet, call `supabase.rpc('check_seat_available', { p_seat_id, p_start_date, p_end_date })` using the day after `end_date` as start and 1 month ahead as a default check window
- If seat is NOT available, show a toast: "Seat #{number} is already booked. Cannot renew."
- If seat IS available, proceed to open the RenewalSheet as before
- Add a loading state to the Renew button while checking

**`src/components/admin/RenewalSheet.tsx`** — `handleCreateBooking` function (line 141)
- Add a secondary availability check right before creating the booking (in case dates were changed in the sheet), using `check_seat_available` with the actual selected start/end dates
- If unavailable at submission time, show error and block creation

| File | Change |
|------|--------|
| `src/pages/admin/ExpiringBookingsPage.tsx` | Pre-check seat availability on Renew click |
| `src/components/admin/RenewalSheet.tsx` | Secondary availability check before booking creation |

