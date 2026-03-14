

# Replace Revenue with Real-Time Attendance Count in Seat/Bed Maps

## What Changes
In both the Reading Room seat map (`VendorSeats.tsx`) and Hostel bed map (`HostelBedMap.tsx`), the stats bar currently shows a "Revenue" item. This will be replaced with a real-time "Present" attendance counter.

## Implementation

### 1. `src/pages/vendor/VendorSeats.tsx`
- **Stats calculation** (line ~331): Remove `revenue` from the stats memo. Add `present: attendanceSet.size` instead.
- **Stats bar** (line ~842): Replace the Revenue entry with `{ label: 'Present', value: stats.present, icon: <UserCheck /> }` using `UserCheck` from lucide-react.
- **Imports** (line ~30): Add `UserCheck` to lucide imports, remove `IndianRupee` if no longer used elsewhere (need to verify).

### 2. `src/pages/admin/HostelBedMap.tsx`
- **Stats calculation** (line ~516): Remove `revenue` from the stats memo. Add `present: attendanceSet.size` instead.
- **Stats bar** (line ~1208): Replace the Revenue entry with `{ label: 'Present', value: stats.present, icon: <UserCheck /> }`.
- **Imports** (line ~27): Add `UserCheck` to lucide imports.

Both already have `attendanceSet` state that auto-refreshes every 30 seconds, so the count will be real-time with no additional data fetching needed.

### Files
- **EDIT**: `src/pages/vendor/VendorSeats.tsx` — 3 small edits
- **EDIT**: `src/pages/admin/HostelBedMap.tsx` — 3 small edits

