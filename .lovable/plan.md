

## Compact All Transactions Table Refactor

### Problem
The current table has excessive row height, multi-line dates, large buttons, and a "Payment" (settlement) column that belongs in receipts, not bookings. Pagination is limited to 10 rows.

### Changes to `src/pages/AdminBookings.tsx`

#### 1. Change page size from 10 to 15
- Update `limit: 10` to `limit: 15` in `fetchBookings`
- Update `Math.ceil((response.count || 0) / 10)` to use 15

#### 2. Remove the "Payment" column (settlement)
- Remove the `Payment` TableHead
- Remove the corresponding TableCell showing `booking.paymentStatus`

#### 3. Compact all table cells
- TableHead: reduce py-3 to py-2
- TableCell: add `py-1.5 px-3 text-xs` for tight rows (~40px height)
- Student cell: single line `Name (email)` instead of stacked div
- Booked On: single-line format `26 Feb 2026, 9:09 AM` using `toLocaleDateString` + `toLocaleTimeString`
- Duration cell: single line `26 Feb - 26 Mar` (remove second line with day/week/month count, or append inline)
- Amount: `text-xs font-semibold`
- Status badge: already compact, keep as-is

#### 4. Compact Actions column
- Replace text buttons (Complete, Cancel, Details) with icon-only buttons wrapped in Tooltip
- Use small `h-6 w-6` icon buttons
- Eye icon for details, CheckCircle2 for complete, XCircle for cancel

#### 5. Add "Showing X-Y of Z entries" footer
- Add a row below pagination: `Showing {start}-{end} of {total} entries`
- Use `totalDocs` from API response (store in state)

#### 6. Reduce outer spacing
- Change gap-6 to gap-4 on wrapper
- Remove CardHeader padding overhead, use `py-3` instead of `pb-4`
- Loader/empty states: reduce `py-16` to `py-10`

### Date formatting helper (inline)
```text
formatDate(dateStr) => "26 Feb 2026, 9:09 AM"
formatDateRange(start, end) => "26 Feb - 26 Mar 2026"
```

### Files Changed

| File | Change |
|------|--------|
| `src/pages/AdminBookings.tsx` | Compact table, remove Payment column, icon-only actions with tooltips, 15 rows/page, add entry count footer |

