

## Fix: Seat Availability Bug + Compact Slot/Category Filters

### Issue 1: Seats showing available even when booked

**Root Cause:** On line 772 of `SeatBookingForm.tsx`, the `slotId` passed to `DateBasedSeatMap` is `selectedSlot?.id`, which equals `'full_day'` when Full Day is selected. In `seatsService.ts` line 263, the filter does `if (slotId) return b.slot_id === slotId` -- since no booking in the database has `slot_id = 'full_day'`, ALL bookings are filtered out, making every seat appear available.

**Fix:** Map `'full_day'` to `undefined` before passing to `DateBasedSeatMap`:
- Line 772: Change `slotId={selectedSlot?.id}` to `slotId={selectedSlot?.id === 'full_day' ? undefined : selectedSlot?.id}`

This ensures Full Day checks ALL bookings regardless of slot, while specific slots still filter correctly.

---

### Issue 2: Compact slot and category filters

**Current problem:** Time slot selection uses large cards in a 2-column grid, taking too much vertical space. Category filter (AC/Non-AC) is in a separate section below.

**Solution:** Consolidate slot selection and category filter into compact pill rows placed directly under the Duration Type section, before seat selection. The layout becomes:

```text
Duration Type:    [Daily] [Weekly] [Monthly]
Time Slot:        [Full Day] [Morning] [Evening] ...
Seat Type:        [All] [AC] [Non-AC] ...
Duration Count + Start Date row
```

Changes to `SeatBookingForm.tsx`:
- Move the slot selection from its current card-based layout (lines 682-712) into a pill-style row identical to the Duration Type pills
- Move the category filter chips (lines 723-756) up to sit right below the slot pills
- Remove the `Separator`, `Clock` icon header, and card styling from slots
- Remove the `Separator` and Step 2 header from category section
- Both become simple labeled pill rows inside the Step 1 "Booking Details" section

The slot pills will show just the slot name (e.g., "Full Day", "Morning", "Evening") without time ranges or prices -- keeping it minimal. Time and price details can show as a small inline badge below when a slot is selected.

---

### Files Modified

| File | Change |
|------|--------|
| `src/components/seats/SeatBookingForm.tsx` | Fix slotId mapping + restructure slot/category into compact pills under duration |

