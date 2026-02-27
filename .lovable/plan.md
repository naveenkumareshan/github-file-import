
## Remaining Items: Slot Deletion Protection, Manual Booking Slot Support, and Slot Toggle Locking

### 1. SlotManagement.tsx -- Deletion Protection

**What changes:** Before deleting a slot, check if any active bookings reference that `slot_id`. If bookings exist, block deletion and show a toast suggesting deactivation instead.

**Details:**
- Import `supabase` client
- In `handleDelete`, before calling `cabinSlotService.deleteSlot()`, query `bookings` table for rows where `slot_id = id` and `payment_status NOT IN ('cancelled', 'failed')`
- If results exist, show a destructive toast: "This slot has active bookings. Please deactivate it instead of deleting."
- If no bookings, proceed with deletion as before

---

### 2. ManualBookingManagement.tsx -- Slot Selection Support

**What changes:** Add slot awareness to the manual booking flow. When a selected cabin has `slots_enabled = true`, show a slot selection step between date selection and seat selection.

**Details:**
- Add imports: `cabinSlotService` and `CabinSlot`
- Add state: `selectedSlot`, `availableSlots`, `cabinSlotsEnabled`
- Update the `Cabin` interface to include `slots_enabled`
- Fix `_id` references to use `id` (since `adminCabinsService` returns Supabase UUIDs as `id`, not `_id`)
- In `handleCabinSelect`: check `cabin.slots_enabled`, if true fetch slots via `cabinSlotService.getSlotsByCabin(cabin.id)`
- Update step flow: when `slotsEnabled`, after date selection go to a new `'select-slot'` step, then proceed to `'select-seat'`
- New `renderSlotSelection()` function: show slot cards with name, time, price; on select, set `selectedSlot` and update pricing to use slot price
- Pass `slotId={selectedSlot?.id}` to `DateBasedSeatMap` in `renderSeatSelection`
- Include `slot_id: selectedSlot?.id` in the booking creation payload (`handleCreateBooking`)
- Update step indicator to show the slot step when applicable
- Use slot price for pricing calculations when slots are enabled

---

### 3. CabinEditor.tsx -- Slot Toggle Locking

**What changes:** Prevent toggling `slots_enabled` OFF when the cabin has active bookings with a `slot_id`.

**Details:**
- In the Section 5 (Slot-Based Booking) `Switch` `onCheckedChange` handler:
  - If toggling OFF (`checked = false`) and `existingCabin?.id` exists:
    - Query `bookings` table for rows where `cabin_id = existingCabin.id`, `slot_id IS NOT NULL`, and `payment_status NOT IN ('cancelled', 'failed')`
    - If results exist, show a destructive toast: "Cannot disable slots -- active slot-based bookings exist" and do NOT update state
    - If no results, allow the toggle
  - If toggling ON, always allow

---

### Files Modified
| File | Change |
|------|--------|
| `src/components/admin/SlotManagement.tsx` | Add booking check before slot deletion |
| `src/pages/admin/ManualBookingManagement.tsx` | Add slot selection step, fix `_id` to `id`, slot-aware pricing |
| `src/components/admin/CabinEditor.tsx` | Add slot toggle lock check |
