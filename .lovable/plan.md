

## Fix Duplicate Booking on Same Seat/Date

### Root Cause

The booking overlap check in `createPartnerBooking` (`src/api/vendorSeatsService.ts`, line 407) only looks for existing bookings with `payment_status` in `['completed', 'advance_paid']`. When a booking is created with "Send Payment Link" (`send_link`), it gets `pending` status. This means:

1. Admin creates a booking via "Send Link" -> status = `pending` -> overlap check passes
2. Admin creates another booking (cash/UPI) -> overlap check ignores the `pending` booking -> duplicate created

Additionally, the overlap check doesn't account for **slot-based bookings**. Two bookings for *different* time slots (Morning vs Evening) on the same seat/dates should be allowed. Currently, it would block them (once this fix includes `pending`), which is incorrect.

### Fix

**File: `src/api/vendorSeatsService.ts`** - `createPartnerBooking` method

1. **Include `pending` in the overlap check**: Change the filter from `['completed', 'advance_paid']` to `['completed', 'advance_paid', 'pending']` so pending bookings also block duplicate creation.

2. **Add slot-aware overlap logic**: If the new booking has a `slotId`, only check for conflicts against bookings with the same `slot_id` OR `null` slot_id (full-day bookings). If the new booking has no slot (full-day), check against all bookings regardless of slot. This ensures:
   - Morning + Evening on same seat = allowed
   - Morning + Morning on same seat = blocked
   - Full Day + any slot on same seat = blocked

### Technical Details

Replace lines 403-415 with:

```text
// Build overlap query
let overlapQuery = supabase
  .from('bookings')
  .select('id, slot_id')
  .eq('seat_id', data.seatId)
  .in('payment_status', ['completed', 'advance_paid', 'pending'])
  .neq('payment_status', 'cancelled')
  .lte('start_date', data.endDate)
  .gte('end_date', data.startDate);

const { data: existing, error: checkError } = await overlapQuery;
if (checkError) throw checkError;

if (existing && existing.length > 0) {
  // Check slot-level conflict
  const hasConflict = existing.some(b => {
    // If new booking is full-day (no slot), conflicts with everything
    if (!data.slotId) return true;
    // If existing booking is full-day (no slot), conflicts with everything
    if (!b.slot_id) return true;
    // Same slot = conflict
    return b.slot_id === data.slotId;
  });
  if (hasConflict) {
    return { success: false, error: 'Seat already has a booking for the selected dates/slot' };
  }
}
```

### Files Modified

| File | Change |
|------|--------|
| `src/api/vendorSeatsService.ts` | Include `pending` status in overlap check; add slot-aware conflict detection |

