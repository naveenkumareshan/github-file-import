

## Unify Student Bookings: Show Hostel Bookings in My Bookings

Currently, the Student "My Bookings" page (`StudentBookings.tsx`) only shows reading room bookings from the `bookings` table. Hostel bookings from `hostel_bookings` are not displayed. This plan adds hostel bookings alongside reading room bookings in the same unified list.

---

### What Changes

**File: `src/pages/StudentBookings.tsx`** (primary change)

1. **Import hostel booking service** -- import `hostelBookingService` from `src/api/hostelBookingService.ts` to fetch the user's hostel bookings.

2. **Fetch hostel bookings in `fetchBookings()`** -- alongside the existing `getCurrentBookings()` and `getBookingHistory()` calls, also call `hostelBookingService.getUserBookings()` to get all hostel bookings for the current user.

3. **Fetch hostel dues** -- in `fetchDues()`, also query the `hostel_dues` table for pending/overdue dues and merge them into the `duesMap` so hostel due amounts show on booking cards too.

4. **Map hostel bookings to the same `Booking` shape** -- create a `mapHostelBooking()` function that transforms hostel_bookings rows into the same `BookingDisplay` interface used by `BookingsList`:
   - `bookingType: 'hostel'`
   - `itemName`: hostel name from joined `hostels` table
   - `itemNumber`: bed number from joined `hostel_beds`
   - `itemImage`: hostel logo_image
   - `paymentStatus` mapped from hostel booking's `payment_status`
   - `totalPrice`, `startDate`, `endDate`, `id`, etc.

5. **Merge and sort** -- combine mapped reading room bookings and hostel bookings into a single array, sorted by `created_at` descending, then split into current (active) and past (expired/cancelled) tabs as before.

6. **Update Active Bookings count** -- the header card count will automatically include hostel bookings since it counts from the merged `currentBookings` array.

7. **Update the "Book New" button** -- optionally add a second button or make it a dropdown: "Book Reading Room" and "Book Hostel". Or keep it simple with just the existing button since hostel booking has its own entry point.

8. **View Details link** -- for hostel bookings, the "View Details" link should navigate to the hostel booking view page (if it exists) or fall back to a generic detail page. Will check for existing hostel booking detail route and use it.

---

### No Database Changes Required

The `hostel_bookings` table already exists with proper RLS policies allowing users to view their own bookings. No migrations needed.

### No New Files

All changes are within `src/pages/StudentBookings.tsx`.

---

### Technical Details

**Hostel booking mapping function:**
```text
hostel booking fields -> BookingDisplay fields:
  id -> id
  serial_number -> bookingId
  start_date -> startDate
  end_date -> endDate
  payment_status -> paymentStatus
  total_price -> totalPrice
  hostels.name -> itemName
  hostel_beds.bed_number -> itemNumber
  hostels.logo_image -> itemImage
  'hostel' -> bookingType
  hostel_id -> cabinId (reuse field for navigation)
  created_at -> createdAt
```

**Current bookings filter for hostel:** `end_date >= today AND payment_status IN ('completed', 'confirmed', 'advance_paid')`

**Past bookings filter for hostel:** `end_date < today OR status IN ('cancelled')`

