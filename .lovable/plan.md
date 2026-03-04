

# Fix: Correct End Date Calculation Across All Booking Flows

## Problem
End date calculations are inconsistent across the app. The correct logic should be:
- **Daily**: end = start date (same day, count=1 means 1 day)
- **Weekly**: end = start + (count × 7 - 1) days (e.g., 1 week from Mar 1 = Mar 7)
- **Monthly**: end = last day of the period (e.g., start Mar 1 → end Mar 31; start Mar 21 → end Apr 20)

## Current Issues by File

| File | Daily | Weekly | Monthly |
|------|-------|--------|---------|
| `SeatBookingForm.tsx` (student reading room) | `addDays(start, count-1)` ✅ | `addWeeks(start, count)` ❌ off by 1 | `addMonths - 1 day` ✅ |
| `VendorSeats.tsx` (partner reading room) | `addDays(start, count-1)` ✅ | `addWeeks(start, count)` ❌ | `addMonths(start, count)` ❌ no -1 day |
| `HostelBedMap.tsx` (partner hostel) | `addDays(start, count)` ❌ | `addWeeks(start, count)` ❌ | `addMonths(start, count)` ❌ |
| `HostelBooking.tsx` (student hostel) | `addDays(start, duration)` ❌ | `addWeeks(start, duration)` ❌ | `addMonths(start, duration)` ❌ |
| `ManualBookingManagement.tsx` (admin) | `addDays(start, count-1)` ✅ | `addWeeks(start, count)` ❌ | `addMonths(start, count)` ❌ |
| `BookingExtensionDialog.tsx` (renewal) | N/A | N/A | `addMonths(end, dur)` ❌ |

## Correct Formulas

```typescript
// Helper: calculate booking end date
function calcEndDate(start: Date, type: string, count: number): Date {
  if (type === 'daily') {
    // 1 day = same day, 2 days = start + 1
    return addDays(start, Math.max(0, count - 1));
  }
  if (type === 'weekly') {
    // 1 week from Mar 1 = Mar 7 (start + 6 days)
    return addDays(start, count * 7 - 1);
  }
  // monthly: Mar 1, 1 month → Mar 31; Mar 21, 1 month → Apr 20
  const raw = addMonths(start, count);
  return subDays(raw, 1);
}
```

## Plan

### 1. Create shared utility `src/utils/dateCalculations.ts`
A single `calculateBookingEndDate(startDate, durationType, count)` function used everywhere.

### 2. Update all 6 files to use the shared utility

| File | Lines to change |
|------|----------------|
| `src/components/seats/SeatBookingForm.tsx` | ~291-303 and ~363-375 (two useEffect blocks) — weekly fix |
| `src/pages/vendor/VendorSeats.tsx` | ~468-471 (computedEndDate memo) — weekly + monthly fix |
| `src/pages/admin/HostelBedMap.tsx` | ~559-562 (computedEndDate memo) — all three fixes |
| `src/pages/HostelBooking.tsx` | ~115-118 (calculateEndDate) — all three fixes |
| `src/pages/admin/ManualBookingManagement.tsx` | ~337-343, ~352-358, ~369-375 (three blocks) — weekly + monthly fix |
| `src/components/admin/BookingExtensionDialog.tsx` | ~68-71 (calculateNewEndDate) — monthly fix |

### Summary of Corrections
- **Daily**: `start + (count - 1)` — already correct in most reading room files, needs fixing in hostel files
- **Weekly**: `start + (count × 7 - 1)` days — wrong everywhere (currently uses `addWeeks` which gives +7 per week instead of +6)
- **Monthly**: `addMonths(start, count) - 1 day` — only correct in `SeatBookingForm.tsx`, needs fixing in 5 other files

