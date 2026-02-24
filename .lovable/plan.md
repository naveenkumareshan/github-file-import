

## Fix Seat Availability, Renewal Amount, View Details & Sorting

### Root Cause Analysis

**1. Seat shows "not available" even though it is available**

The `BookingRenewal` component calls `seatsService.checkSeatAvailability(seatId, ...)` but the `seatId` passed is `null`. Here's why:
- In `StudentBookings.tsx`, the `mapBooking` function sets `seatId: null` (line 62)
- The booking table has a `seat_id` column but it's `NULL` for existing bookings (only `seat_number` is populated)
- When `BookingRenewal` tries to extract the seat ID (`booking.seatId`), it gets `null`
- `checkSeatAvailability` then queries `seats.eq('id', null)` which fails, returning "not available"

**Fix**: In `StudentBookings.tsx`, look up the seat by `cabin_id` + `seat_number` to populate `seatId` with the actual seat UUID and price. Also update `BookingRenewal` to handle the case where `seatId` might be a string UUID (not an object), and fetch the seat price from the DB if not embedded.

**2. Renewal amount calculation is wrong**

`BookingRenewal.calculateAdditionalAmount()` reads `booking.seatId?.price` but:
- `seatId` is either `null` or a plain string UUID (not an object with `.price`)
- Falls back to hardcoded `1000` instead of the actual seat price (`2000` in this case)

**Fix**: After fixing the seatId population in `mapBooking` to include the price, or fetch seat price inside `BookingRenewal` when the dialog opens.

**3. View Details shows large desktop-style page**

The `StudentBookingView` component uses `container mx-auto px-4 py-8 max-w-4xl` with large Card headers -- not matching the compact mobile app layout.

**Fix**: Redesign `StudentBookingView` to use compact mobile-friendly layout matching the app style (smaller text, tighter spacing, rounded cards).

**4. Bookings not sorted newest first**

`getCurrentBookings()` sorts by `end_date ascending`. Both active and expired tabs should show newest bookings first.

**Fix**: Change sort order to `created_at descending` in `getCurrentBookings()` and ensure the history list also uses descending order.

---

### Implementation Plan

#### File 1: `src/pages/StudentBookings.tsx`
- Update `mapBooking` to populate `seatId` as an object with `_id`, `number`, and `price` by joining seat data
- Update `fetchBookings` to also fetch seat info from the `seats` table for each booking's `seat_number` + `cabin_id`
- Sort both active and expired lists by `created_at` descending (newest first)

#### File 2: `src/api/bookingsService.ts`
- Update `getCurrentBookings()` to sort by `created_at` descending instead of `end_date` ascending
- Update `getCurrentBookings()` and `getBookingHistory()` to also join the `seats` table data (seat price) via the `seat_id` column, or return `seat_number` for lookup

#### File 3: `src/components/booking/BookingRenewal.tsx`
- Add a `useEffect` that fetches the actual seat price from the database when the dialog opens, using `cabin_id` + `seat_number` if `seatId` doesn't have a price
- Update `checkSeatAvailability` to find the seat UUID by `cabin_id` + `seat_number` if `seatId` is null or not a valid UUID
- This ensures amount calculation uses the real seat price, not the fallback `1000`

#### File 4: `src/pages/students/StudentBookingView.tsx`
- Redesign the layout to be compact and mobile-friendly:
  - Remove large `container max-w-4xl` wrapper
  - Use smaller text sizes (`text-[13px]`, `text-[11px]`)
  - Compact card with rounded corners matching app style
  - Inline booking info instead of 2-column grid
  - Smaller back button and header
  - Keep the `BookingTransactionView` section but make it fit the mobile layout

---

### Technical Details

| Issue | Root Cause | Fix Location |
|---|---|---|
| Seat "not available" | `seatId` is null in booking data, checkSeatAvailability fails | `StudentBookings.tsx` mapBooking + `BookingRenewal.tsx` seat lookup |
| Wrong renewal amount | Falls back to Rs.1000 instead of actual seat price (Rs.2000) | `BookingRenewal.tsx` fetch seat price on open |
| View Details blank/ugly | Large desktop layout on mobile | `StudentBookingView.tsx` redesign |
| Sort order | Active sorted by end_date asc | `bookingsService.ts` change to created_at desc |

