

## Reorganize Booking Configuration Section in Room Editor

### Changes

**File: `src/components/admin/CabinEditor.tsx`**

1. **Rename Section 5** from "Slot-Based Booking" to "Booking Configuration" with description "Configure booking durations and time slots" -- since "Offer bookings for" applies to all bookings, not just slot-based ones.

2. **Reorder content** so "Offer bookings for" (allowed durations) appears first, before the "Enable Slots" toggle. Current order vs new order:
   - Current: Enable Slots → Offer bookings for → Apply slots to → Time Slots
   - New: **Offer bookings for → Enable Slots → Apply slots to → Time Slots**

3. **Auto-disable slots when no applicable durations selected**: When user deselects all items in "Apply slots to", automatically turn off the `slotsEnabled` toggle. This means time slots section hides when nothing is selected in "Apply slots to".

### Files Modified

| File | Change |
|------|--------|
| `src/components/admin/CabinEditor.tsx` | Rename section title; move "Offer bookings for" above "Enable Slots"; auto-disable slots when Apply slots to is empty |

