

## Seat Map: Slot-Based Coloring and Price Edit Button

### Problem 1: No visual distinction for Morning/Evening slot bookings
Currently, a booked seat always shows as red regardless of whether the student booked "Morning", "Evening", or "Full Day". The admin needs to visually identify partial-slot bookings.

### Problem 2: Price edit missing from hover actions
When hovering over a seat card in the grid, only "Block" and "Details" buttons appear. The price edit action is missing from the hover overlay, making it inaccessible.

### Solution

**File: `src/api/vendorSeatsService.ts`**

1. Add `slotId` and `slotName` to the `VendorSeat.currentBooking` interface.
2. In `getSeatsForDate`, join the `cabin_slots` table in the bookings query (or fetch slot names separately) to get the slot name.
3. When building `currentBooking`, include `slotId` and `slotName` from the active booking. A `null` slot_id means "Full Day".

**File: `src/pages/vendor/VendorSeats.tsx`**

**Slot-based coloring:**
1. Introduce a new `dateStatus` visual variant: when `dateStatus` is `booked` and `currentBooking.slotId` is not null, show a distinct color:
   - Full Day booked (slotId is null): Red (existing)
   - Morning only: Purple/Violet (`bg-violet-50 border-violet-400`)
   - Evening only: Blue (`bg-blue-50 border-blue-400`)
2. Update `statusColors`, `statusLabel`, and `statusIcon` to handle `booked_morning` and `booked_evening` variants, or add a secondary indicator on the seat card showing "Morning" / "Evening" badge.
3. **Simpler approach chosen**: Keep `dateStatus` as-is. Add a small colored badge/indicator on the seat card when the booking has a slot. Show "AM" (morning) in a violet badge or "PM" (evening) in a blue badge. Full day shows no extra badge (stays red). This avoids changing the status system.
4. Add "Morning" and "Evening" to the legend alongside the existing Available/Booked/Expiring/Blocked indicators.

**Price edit in hover overlay:**
1. Add a third button to the hover overlay (lines 720-728) for price editing:
   ```text
   <Button variant="ghost" size="sm" className="h-6 w-6 p-0" 
     onClick={(e) => { e.stopPropagation(); setEditingSeatId(seat._id); setEditPrice(String(seat.price)); }} 
     title="Edit Price">
     <Edit className="h-3 w-3" />
   </Button>
   ```
2. When `editingSeatId` matches the current seat, show an inline price input replacing the card content (or a small popover).

### Files Modified

| File | Change |
|------|--------|
| `src/api/vendorSeatsService.ts` | Include `slot_id` in currentBooking mapping; join `cabin_slots` for slot name |
| `src/pages/vendor/VendorSeats.tsx` | Add morning/evening badge on seat cards; add Edit Price button to hover overlay; update legend |

### Technical Details

**Booking query change** in `getSeatsForDate`:
- The bookings query already fetches all columns (`*`), so `slot_id` is already available. Just need to also fetch the slot name by joining `cabin_slots` or doing a separate lookup.

**Seat card visual** (grid view):
```text
[S1]
 AC
₹2000
Booked [AM]   <-- violet "AM" badge for morning slot
```

**Legend update:**
- Add: Purple dot = "Morning", Blue dot = "Evening" (in addition to existing colors)
