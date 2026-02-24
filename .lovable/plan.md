

## Show Full Booking Period + Auto-Release Seats After Proportional End Date

### Problem
Currently, `advance_paid` bookings are not fetched at all in the seat grid (only `completed` bookings are queried). This means advance-paid seats show as "available" immediately. The partner also needs to see the full booking end date (not the proportional date) in the seat info.

### What Changes

**File: `src/api/vendorSeatsService.ts`**

1. **Fetch advance_paid bookings (line 257)**: Change `.eq('payment_status', 'completed')` to `.in('payment_status', ['completed', 'advance_paid'])` so advance-paid bookings appear in the seat grid.

2. **Fetch dues for advance_paid bookings (after line 270)**: After fetching bookings, query the `dues` table for any `advance_paid` bookings to get their `proportional_end_date`. Build a map: `{ booking_id -> proportional_end_date }`.

3. **Update `computeDateStatus` (line 125)**: Accept the dues map as a parameter. When an active booking has `payment_status === 'advance_paid'`, check the dues map for its `proportional_end_date`. If `selectedDate > proportional_end_date`, return `'available'` (seat auto-released). Otherwise, treat as normal booked/expiring_soon using the **full** `end_date`.

4. **Keep currentBooking.endDate as full end date (line 284)**: No change needed here — `currentBookingRaw.end_date` is already the full booking period end date. The partner will see "Booked until [full end date]".

5. **Update currentBooking filtering (line 278)**: For `advance_paid` bookings, also check against `proportional_end_date` from the dues map. If `selectedDate > proportional_end_date`, do NOT show it as `currentBooking` (since the seat is effectively released for that date).

### Logic Summary

```text
For each seat on a given date:
  1. Find active booking (start_date <= date <= end_date)
  2. If booking is 'completed' -> normal booked/expiring_soon logic
  3. If booking is 'advance_paid':
     a. Look up proportional_end_date from dues
     b. If date > proportional_end_date -> seat is 'available' (auto-released)
     c. If date <= proportional_end_date -> seat is 'booked', show full end_date to partner
```

### Files Changed

| File | Change |
|------|--------|
| `src/api/vendorSeatsService.ts` | Fetch advance_paid bookings, fetch dues map, update computeDateStatus + currentBooking logic |

No database changes needed.

