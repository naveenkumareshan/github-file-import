

# Mess Attendance Timing, Linked Hostels Display & Source-Based Analytics

## 1. Connect Meal Timings to Attendance

Currently, meal type detection in `MessAttendance.tsx` uses hardcoded hour thresholds (breakfast < 11, lunch < 16, else dinner). The `mess_meal_timings` table already stores per-mess `start_time`/`end_time` for each meal. 

**Change**: Load `mess_meal_timings` for the mess and use them to determine `currentMeal` dynamically. If a timing exists, use its time range; fallback to the hardcoded thresholds if no timings are configured.

**File**: `src/pages/admin/MessAttendance.tsx`
- Import `getMealTimings` from messService
- Load timings on mess load
- Replace `getCurrentMealType()` with a function that checks current time against configured timings

## 2. Show Linked Hostels on Mess Card

The `MessItem` card doesn't fetch or display linked hostels. 

**Change**: In `MessManagement.tsx`, after fetching mess list, batch-fetch all `hostel_mess_links` with hostel names for those mess IDs. Pass linked hostel names as a prop to `MessItem`. Display them as small badges below the "Student Visible/Hidden" badge row.

**Files**:
- `src/pages/admin/MessManagement.tsx` — fetch links, pass to MessItem
- `src/components/admin/MessItem.tsx` — accept `linkedHostels` prop, render hostel name badges

## 3. Source-Based Analytics (Hostel vs Manual vs Addon)

Add a summary section in `MessBookings.tsx` showing subscription counts and revenue grouped by `source_type`. This lets partners track how many subscribers come from each hostel vs manual bookings.

**Change**: After fetching subscriptions, compute aggregated stats:
- Count & revenue per `source_type` (manual, hostel_inclusive, addon_purchase)
- For hostel sources, further group by hostel name
- Display as compact stat cards above the table

Additionally, in the `MessAttendance.tsx` subscriber summary section, show a breakdown of subscribers by source (how many from hostel X, how many manual).

**Files**:
- `src/pages/admin/MessBookings.tsx` — add source analytics cards above the table
- `src/pages/admin/MessAttendance.tsx` — add source breakdown in subscriber summary

## Summary of File Changes

| File | Change |
|------|--------|
| `src/pages/admin/MessAttendance.tsx` | Use meal timings for current meal detection; add source breakdown in subscriber stats |
| `src/pages/admin/MessManagement.tsx` | Fetch hostel_mess_links and pass to MessItem |
| `src/components/admin/MessItem.tsx` | Display linked hostel names as badges |
| `src/pages/admin/MessBookings.tsx` | Add source-based revenue/count analytics cards |

