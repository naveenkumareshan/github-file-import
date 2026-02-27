

## Add "Full Day" Default Slot When Slots Are Enabled

### Problem
When a cabin has `slots_enabled = true`, the current UI forces the student to pick a time slot. But there's no "Full Day" option -- if the student wants to use the reading room for the entire operating hours, they have no way to do so. Additionally, if no slot is selected, it should default to "Full Day" behavior instead of blocking the booking.

### Solution
Add a virtual "Full Day" option as the first card in the slot picker. This option uses the cabin's base price (from the seat) rather than a slot-specific price. When "Full Day" is selected (or when no explicit slot is chosen), `slot_id` is sent as `null` in the booking payload, meaning the booking covers the full operating hours.

### Changes

#### 1. `src/components/seats/SeatBookingForm.tsx`
- Create a virtual "Full Day" slot object with `id: 'full_day'`, using the cabin's opening/closing time and the seat price
- Prepend this virtual slot to the `availableSlots` array when rendering slot cards
- Auto-select "Full Day" as the default when slots load (so slot is never unselected)
- When `selectedSlot.id === 'full_day'`, send `slot_id: null` in the booking payload (no slot restriction)
- Pricing: "Full Day" uses seat price; specific slots use slot price (existing logic works since `selectedSlot` will be the virtual full-day object with `price = seat.price`)
- Remove the hard block "Please select a time slot" since Full Day is pre-selected
- Update the blocking condition: `cabin.slotsEnabled && !selectedSlot` will no longer trigger because Full Day is auto-selected

#### 2. `src/pages/admin/ManualBookingManagement.tsx`
- Same approach: add a virtual "Full Day" slot when fetching slots for a cabin
- Auto-select "Full Day" as default
- When creating booking, if `selectedSlot.id === 'full_day'`, send `slot_id: null`

#### 3. `src/api/seatsService.ts` (No change needed)
- When `slotId` is `undefined`/`null`, availability already checks without slot filtering -- this is the "full day" behavior

### Technical Detail

The virtual Full Day slot object:
```typescript
const fullDaySlot: CabinSlot = {
  id: 'full_day',
  cabin_id: cabinId,
  name: 'Full Day',
  start_time: cabin.openingTime || '06:00',
  end_time: cabin.closingTime || '22:00',
  price: selectedSeat?.price || cabin?.price || 0,
  is_active: true,
  created_at: '',
};
```

- Auto-selected on load so the flow is never blocked
- Price updates dynamically when a seat is selected (full day = seat price, specific slot = slot price)
- `slot_id` in booking payload: `selectedSlot?.id === 'full_day' ? undefined : selectedSlot?.id`

### Files Modified
| File | Change |
|------|--------|
| `src/components/seats/SeatBookingForm.tsx` | Add Full Day virtual slot, auto-select it, adjust payload |
| `src/pages/admin/ManualBookingManagement.tsx` | Add Full Day virtual slot, auto-select it, adjust payload |

