

## Match Duration Module in Vendor Booking/Renewal to Student Booking

### Problem
1. The "Plan" dropdown in vendor seat booking/renewal uses `monthly / 15days / custom` as a `<Select>`, while the student booking uses a pill-based `daily / weekly / monthly` toggle (filtered by `allowed_durations`) with a count selector (e.g., "2 Months", "3 Days"). These should match.
2. When "Custom" is selected, the `showSlotSelector` logic checks if `applicableDurations.includes('custom')` which never matches any configured duration, so the Time Slot selector disappears entirely.

### Solution

**File: `src/pages/vendor/VendorSeats.tsx`**

Replace the current Plan `<Select>` + custom days `<Input>` with the same duration module used in the student booking (`SeatBookingForm.tsx`):

1. **Replace state variables**:
   - Remove `bookingPlan` (string: 'monthly'/'15days'/'custom') and `customDays`
   - Add `selectedDuration` state: `{ type: 'daily' | 'weekly' | 'monthly', count: number }` defaulting to `{ type: 'monthly', count: 1 }`

2. **Replace Plan UI** (lines 1187-1204) with:
   - A pill-based toggle showing `Daily / Weekly / Monthly` (filtered by `selectedCabinInfo?.allowedDurations || selectedCabinInfo?.allowed_durations || ['daily','weekly','monthly']`)
   - A count selector (number input or select) labeled "Days"/"Weeks"/"Months" depending on the type

3. **Update `computedEndDate`** (line 384-388):
   - Use `addDays(start, count)` for daily, `addWeeks(start, count)` for weekly, `addMonths(start, count)` for monthly (import `addWeeks` from date-fns)

4. **Update price calculation** (lines 432-444):
   - `daily`: `basePrice / 30 * count`
   - `weekly`: `basePrice / 4 * count` (approx)
   - `monthly`: `basePrice * count`

5. **Fix `showSlotSelector`** (lines 447-451):
   - Change to check `applicableDurations.includes(selectedDuration.type)` instead of mapping plan names

6. **Update booking submission** (where `bookingPlan` is sent to backend):
   - Map `selectedDuration.type` and `selectedDuration.count` to the existing backend fields (`bookingDuration`, `durationCount`, `months`)

### Files Modified

| File | Change |
|------|--------|
| `src/pages/vendor/VendorSeats.tsx` | Replace Plan select/custom with daily/weekly/monthly pill toggle + count selector; fix slot visibility; update price and end date calculations |

