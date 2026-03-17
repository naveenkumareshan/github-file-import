

## Plan: Scope Attendance to Selected Property

### Problem
Both the Seat Map (`VendorSeats.tsx`) and Bed Map (`HostelBedMap.tsx`) always fetch attendance for **all** properties and display `attendanceSet.size` as the "Present" count. When a single property is selected, the present count and green dots still reflect all properties combined.

### Fix (2 changes per file)

**1. Scope attendance fetch to selected property**

- **VendorSeats.tsx**: When `selectedCabinId` is set, pass only `[selectedCabinId]` to `getAllPropertiesAttendanceToday`. When "All" is selected, pass all cabin IDs. Add `selectedCabinId` to the effect's dependency array.
- **HostelBedMap.tsx**: Same pattern — when a specific hostel is selected, pass only that hostel's ID. Add the selected hostel to dependencies.

**2. Fix "Present" stat to count from visible data**

Instead of `attendanceSet.size` (which counts all attendance entries including ones for other properties), compute present as:
```
seats.filter(s => attendanceSet.has(s._id)).length   // VendorSeats
beds.filter(b => attendanceSet.has(b.id)).length      // HostelBedMap
```

This ensures the count matches only the currently displayed seats/beds.

### Files to modify
- `src/pages/vendor/VendorSeats.tsx` — lines 221-231 (fetch scoping) and line 327 (present count)
- `src/pages/admin/HostelBedMap.tsx` — lines 247-257 (fetch scoping) and line 514 (present count)

