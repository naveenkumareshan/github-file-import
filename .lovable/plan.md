

## Add Slot-Based Booking for Partner and Fix Price Not Updating with Plan Change

### Problem 1: No Slot Selection in Partner Booking
The admin manual booking page (`ManualBookingManagement.tsx`) supports slot-based bookings (fetching cabin slots, selecting a slot, adjusting price), but the partner/vendor booking form in `VendorSeats.tsx` has no slot selection at all. When the cabin has `slots_enabled`, the partner should be able to pick a time slot.

### Problem 2: Price Not Changing When Plan Changes
When the partner changes the plan (Monthly -> 15 Days -> Custom), the `bookingPrice` state is never recalculated. It's set once on seat click (line 207) and stays static. The price should scale proportionally with the selected duration (e.g., 15 days = half of monthly price).

---

### Fix 1: Add Slot Selection to Partner Booking Form

**File: `src/api/vendorSeatsService.ts`**
- Add `slotsEnabled`, `slotsApplicableDurations` fields to `VendorCabin` interface
- Map `cabin.slots_enabled` and `cabin.slots_applicable_durations` in `getVendorCabins`
- Add `slotId` to `PartnerBookingData` interface
- Include `slot_id` in the booking insert inside `createPartnerBooking` when a non-full-day slot is selected

**File: `src/pages/vendor/VendorSeats.tsx`**
- Add state: `selectedSlot`, `availableSlots`
- When a seat is selected and its cabin has `slotsEnabled`, fetch slots via `cabinSlotService.getSlotsByCabin`
- Add a slot selector UI between the Plan dropdown and the Dates section (only shown when cabin has slots enabled and current duration is in `slotsApplicableDurations`)
- Auto-select "Full Day" as default (uses seat base price)
- When a specific slot is selected, use slot price instead of seat price
- Pass `slotId` in `handleCreateBooking`

### Fix 2: Recalculate Price When Plan Changes

**File: `src/pages/vendor/VendorSeats.tsx`**
- Add a `useEffect` that watches `bookingPlan`, `customDays`, `selectedSlot`, and `selectedSeat`
- When plan changes, recalculate the base price proportionally:
  - Monthly (30 days): use full seat/slot price
  - 15 Days: use `price / 2`
  - Custom X days: use `(price / 30) * X`
- Update `bookingPrice` accordingly

---

### Technical Details

**New state variables in VendorSeats.tsx:**
```text
selectedSlot: CabinSlot | null
availableSlots: CabinSlot[]
```

**Slot selector UI** (inserted after the Plan dropdown, before Dates):
- Only visible when `selectedCabinInfo?.slotsEnabled` is true and the current plan is in `slotsApplicableDurations`
- Shows radio-style buttons for each slot (Full Day auto-added as first option)
- Displays slot name and time range

**Price recalculation logic:**
```text
basePrice = selectedSlot && selectedSlot.id !== 'full_day' ? selectedSlot.price : selectedSeat.price
if plan === 'monthly': price = basePrice
if plan === '15days': price = Math.round(basePrice / 2)
if plan === 'custom': price = Math.round((basePrice / 30) * customDays)
```

**Booking insert change** in `createPartnerBooking`:
- Add `slot_id: data.slotId || null` to the insert object

### Files Modified

| File | Change |
|------|--------|
| `src/api/vendorSeatsService.ts` | Add `slotsEnabled`, `slotsApplicableDurations` to VendorCabin; add `slotId` to PartnerBookingData; include `slot_id` in booking insert |
| `src/pages/vendor/VendorSeats.tsx` | Add slot selection UI; add price recalculation when plan/slot changes |

