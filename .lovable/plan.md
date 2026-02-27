

## Fix Review & Pay Missing Details + Advance Payment Duration Control

### Issue 1: Missing Details in "Review & Pay" Section
The Step 3 "Review & Pay" summary (lines 796-887 in `SeatBookingForm.tsx`) only shows Selected Seat, Seat Price, Locker, and Total Amount. It's missing:
- **Seat Type** (category like AC/Non-AC)
- **Duration Type** (Daily/Weekly/Monthly with count)
- **Time Slot** (if a slot is selected)

**Fix in `src/components/seats/SeatBookingForm.tsx`** (around line 808, after the Selected Seat row):

Add three new rows in the summary card:
1. **Duration**: Show `{count} {type}` (e.g., "1 Monthly") with start-end date range
2. **Time Slot**: Show slot name and time range (only when a slot is selected and it's not Full Day with no slots enabled)

The seat category is already shown as a badge next to the seat number (line 801-804), so that's covered. But we should also add the duration and slot info.

---

### Issue 2: Advance Payment Duration Restriction

Currently, `advanceBookingEnabled` applies globally to all duration types. The admin/partner should be able to specify which duration types allow advance payment (e.g., only Monthly).

**Database Migration**: Add a new column to the `cabins` table:
```sql
ALTER TABLE cabins 
  ADD COLUMN advance_applicable_durations jsonb NOT NULL DEFAULT '["daily","weekly","monthly"]';
```

**Admin UI (`CabinEditor.tsx`)**: Inside the advance booking section (after the existing fields, around line 509), add checkboxes for "Allow advance for" with Daily/Weekly/Monthly options. Only show durations that are in `allowedDurations`.

**API Layer (`adminCabinsService.ts`)**: Map `advanceApplicableDurations` to `advance_applicable_durations` in create/update.

**Student Booking (`SeatBookingForm.tsx`)**: Change the `advanceEnabled` check from:
```typescript
const advanceEnabled = cabin?.advanceBookingEnabled === true;
```
to:
```typescript
const advanceApplicableDurations = (cabin as any)?.advance_applicable_durations || 
  (cabin as any)?.advanceApplicableDurations || ['daily','weekly','monthly'];
const advanceEnabled = cabin?.advanceBookingEnabled === true && 
  advanceApplicableDurations.includes(selectedDuration.type);
```

This makes the "Book with advance payment" checkbox only appear when the selected duration type is in the allowed list.

---

### Files Modified

| File | Change |
|------|--------|
| Database migration | Add `advance_applicable_durations` column to `cabins` |
| `src/api/adminCabinsService.ts` | Map `advanceApplicableDurations` in create/update |
| `src/components/admin/CabinEditor.tsx` | Add "Allow advance for" duration checkboxes inside advance booking section; add state field |
| `src/components/seats/SeatBookingForm.tsx` | Add duration type, slot info rows to Review & Pay summary; conditionally show advance based on selected duration |

