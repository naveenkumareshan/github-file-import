

# Fix Duplicate Booking Serial Numbers

## Root Cause

The `generate_serial_number` function uses the `entity_type` parameter as a case-sensitive key in the `serial_counters` table. Two different callers pass different casing:

- **Database trigger** (`set_serial_bookings`): passes `'BOOK'` -- produces `IS-BOOK-2026-XXXXX`
- **VendorSeats code** (`vendorSeatsService.ts` line 435): passes `'booking'` -- produces `IS-booking-2026-XXXXX`

This creates two separate counter rows (`BOOK` with seq 16, `booking` with seq 5), and numbers like `00004` and `00005` appear under both prefixes -- making them look duplicated.

## Fix

### 1. Fix the client-side call in `vendorSeatsService.ts`
- Line 435: Change `p_entity_type: 'booking'` to `p_entity_type: 'BOOK'` so it uses the same counter as the trigger.

### 2. Database migration to merge the orphaned counter and fix existing records
- Merge the `booking` counter's count into `BOOK` (add 5 to 16, making it 21 so no future collisions).
- Update the 5 bookings that have `IS-booking-` prefix to use `IS-BOOK-` with new unique sequence numbers (17-21).
- Delete the orphaned `booking` row from `serial_counters`.

```sql
-- Step 1: Reassign IS-booking- records to IS-BOOK- with fresh sequence numbers
-- Step 2: Update BOOK counter to account for the merged records
-- Step 3: Remove the orphan 'booking' counter
```

### 3. Make the serial number generator case-insensitive (optional safety)
- Update `generate_serial_number` function to uppercase the input: `p_entity_type := UPPER(p_entity_type)` so this class of bug can never happen again.

## Files to Modify

| File | Change |
|------|--------|
| `src/api/vendorSeatsService.ts` | Line 435: `'booking'` to `'BOOK'` |
| New migration | Merge counters, fix existing `IS-booking-` records, add `UPPER()` safety |

