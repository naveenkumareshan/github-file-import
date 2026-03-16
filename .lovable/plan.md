

## Plan: Compact Room/Seat/Floor Display and Reduce Column Widths

### Problem
Adding floor info to Room/Seat columns has made them wider, pushing other columns and consuming too much horizontal space across booking tables.

### Solution
1. **Shorten the format** — Use abbreviated format: `Room / F1 · S2` instead of `Room / Floor 1 · Seat 2`
2. **Remove `whitespace-nowrap`** on Room/Seat cells and allow wrapping where room name is long
3. **Add `max-w` constraints** on wide columns (Student, Room/Seat, Booked On)

### Files to Change

| File | Change |
|------|--------|
| `src/pages/AdminBookings.tsx` (line 214) | Change format to `F{floor} · S{number}`, remove `whitespace-nowrap`, add `max-w-[150px]` |
| `src/pages/admin/ExpiringBookingsPage.tsx` (lines 237-238) | Same abbreviated format `F{floor} · S{number}` |
| `src/pages/admin/Receipts.tsx` | Same abbreviated format |
| `src/pages/admin/DueManagement.tsx` | Same abbreviated format |
| `src/components/admin/AdminBookingsList.tsx` (lines 470-485) | Same abbreviated format, remove nowrap |
| `src/components/admin/operations/ReportedTodaySection.tsx` | Same abbreviated format |
| `src/components/admin/operations/CheckInTracker.tsx` | Same abbreviated format |
| `src/components/admin/operations/CheckInViewDetailsDialog.tsx` | Same abbreviated format |
| `src/components/booking/BookingTransactionView.tsx` | Same abbreviated format |

### Format Change
```
Before: Toppers reading room / Floor 2 · Seat 60
After:  Toppers reading room / F2 · S60
```

This saves ~10 characters per cell. Combined with allowing text wrap on long room names, column width will shrink significantly.

