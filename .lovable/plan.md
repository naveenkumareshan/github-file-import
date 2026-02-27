

## Fix Seat Availability for Slot Conflicts and Category Filter Behavior

### Problem 1: Full Day Booking Not Blocking Slot-Specific Checks
When a seat is booked for "Full Day" (stored as `slot_id = null` in the database), the current availability logic in `seatsService.ts` fails to recognize this conflict when checking for a specific slot (e.g., Morning or Evening). This is because the filter `b.slot_id === slotId` skips rows where `slot_id` is null.

**Fix in `src/api/seatsService.ts`** (two places -- `getAvailableSeatsForDateRange` and `checkSeatsAvailabilityBulk`):

Change the slot conflict filter logic from:
```typescript
if (slotId) return b.slot_id === slotId;
```
to:
```typescript
if (slotId) return b.slot_id === slotId || b.slot_id === null;
```

This ensures that "Full Day" bookings (null slot_id) always block the seat for any specific slot, while still allowing two different specific slots to coexist on the same seat.

---

### Problem 2: Category Filter Hides All Other Seats
When a category is selected (e.g., "AC"), seats of other categories disappear entirely from the map. Users lose spatial context and cannot see the room layout properly.

**Fix in `src/components/seats/DateBasedSeatMap.tsx`**:

Instead of filtering out non-matching seats, pass all seats through but mark non-matching ones as unavailable and unselectable:

Change the `transformedSeats` logic (line 216-228) from filtering by category to marking non-matching category seats as unavailable:
```typescript
const transformedSeats = availableSeats.map((seat) => {
  const availabilityInfo = seatAvailability.find(
    (info) => info.seatId === seat._id
  );
  const categoryMismatch = categoryFilter && seat.category !== categoryFilter;
  return {
    ...seat,
    isAvailable: categoryMismatch ? false : (availabilityInfo?.isAvailable ?? seat.isAvailable),
    isCategoryMismatch: categoryMismatch,
    conflictingBookings: availabilityInfo?.conflictingBookings || [],
    isDateFiltered: true,
  };
});
```

Remove the `.filter(...)` call entirely so all seats remain visible.

Additionally, update the `onSeatSelect` handler passed to `FloorPlanViewer` to prevent selecting category-mismatched seats (wrap the handler to check the flag).

---

### Files Modified

| File | Change |
|------|--------|
| `src/api/seatsService.ts` | Fix slot conflict logic in two methods to treat `slot_id = null` (Full Day) as conflicting with any specific slot |
| `src/components/seats/DateBasedSeatMap.tsx` | Show all seats regardless of category filter; mark non-matching ones as unavailable instead of hiding them |

