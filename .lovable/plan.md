

## Plan: Move Attendance PIN to Operations Hub Header

### What's changing

Move the `AttendancePinDisplay` from the PropertyAttendance page to the Operations Hub page, positioned in the top-right corner of the header. Make it compact and mobile-friendly for the partner app.

### Implementation

**1. Refactor `AttendancePinDisplay` to be self-contained**
- Currently it receives `properties` as props. Change it to fetch its own properties internally (using the same cabins + hostels query pattern from PropertyAttendance), so it can be dropped anywhere without prop wiring.
- Use `getEffectiveOwnerId()` to scope properties to the current partner/employee.

**2. Make it a compact top-right button/popover on mobile**
- Replace the full card layout with a small `KeyRound` icon button in the header row.
- On click, open a `Popover` (or `Sheet` on mobile) showing the property selector, PIN digits, and countdown.
- This keeps it accessible without taking vertical space.

**3. Update `OperationsHub.tsx`**
- Import `AttendancePinDisplay` and place it in the header row next to the title, aligned right.
- Change the header from a simple `<div>` to a flex row: title on left, PIN button on right.

**4. Remove from `PropertyAttendance.tsx`**
- Remove the `AttendancePinDisplay` import and usage since it now lives in Operations Hub.

### Files to modify
- **`src/components/admin/AttendancePinDisplay.tsx`** — make self-contained (fetch own properties), convert to popover/compact layout
- **`src/pages/admin/OperationsHub.tsx`** — add PIN display to header top-right
- **`src/pages/admin/PropertyAttendance.tsx`** — remove PIN display

