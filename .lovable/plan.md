

# Plan: Remove Locker Mandatory Enforcement on Partner Side

## Problem
When partners create bookings in the Seat Control Center (VendorSeats), the locker checkbox is automatically checked AND disabled when the cabin has `lockerMandatory: true`. Partners should always be free to include or exclude the locker — the mandatory setting should only apply to student-facing bookings.

## Changes

### `src/pages/vendor/VendorSeats.tsx` — 3 edits

1. **Line ~328**: Stop auto-checking locker based on mandatory flag. Change to:
   ```tsx
   setLockerIncluded(false);
   ```
   Partners start unchecked and can opt in.

2. **Line ~1522**: Remove the `disabled` prop from the locker checkbox so partners can always toggle it:
   ```tsx
   <Checkbox
     id="locker"
     checked={lockerIncluded}
     onCheckedChange={(v) => setLockerIncluded(v === true)}
     className="h-3.5 w-3.5"
   />
   ```

3. **Line ~1526**: Remove the "(Mandatory)" label suffix — just show "Locker":
   ```tsx
   <Label htmlFor="locker" className="text-[11px] cursor-pointer">Locker</Label>
   ```

| File | Change |
|------|--------|
| `src/pages/vendor/VendorSeats.tsx` | Remove auto-check, remove disabled state, remove mandatory label on partner booking flow |

