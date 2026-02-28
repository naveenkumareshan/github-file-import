

## Rename "Refund Management" to "Refund Pendings" and Filter by Expired Dates

### Problem
1. The tab label "Refund Management" is confusing -- it should be "Refund Pendings"
2. The "Refund Pendings" tab currently shows ALL deposits that haven't been refunded, but it should only show records where the seat/bed validity date has expired (end_date < today)
3. Once refunded, records should only appear in the "Refunded" tab

### Changes

**1. Rename tabs in both places:**

- `src/pages/admin/DepositAndRestrictionManagement.tsx` (Reading Room) -- line 37: "Refund Management" becomes "Refund Pendings"
- `src/pages/admin/HostelDeposits.tsx` (Hostel) -- line 46: "Refund Management" becomes "Refund Pendings"

**2. Update header title in RefundManagement.tsx** (Reading Room):
- Line 178: Change `"Refund Management"` to show "Refund Pendings" when status is pending, "Refunded" when status is refunded

**3. Update header title in HostelDeposits.tsx** (Hostel):
- Line 316: Change `"Refund Management"` to "Refund Pendings" when status is pending

**4. Filter hostel "Refund Pendings" to only show expired bookings** (`src/pages/admin/HostelDeposits.tsx`):
- In `HostelRefundManagement.fetchData()` (line 239), add an additional filter for pending: only include bookings where `end_date < today` AND not yet refunded
- Change: `(allBookings || []).filter(b => !refundedBookingIds.has(b.id))` to also check `new Date(b.end_date) < new Date()` (today)

**5. Reading Room RefundManagement** (`src/components/admin/RefundManagement.tsx`):
- The backend API (`depositRefundService.getRefunds`) handles filtering server-side. The `status` prop is already passed as a filter. The backend controller should already filter by expired `endDate` for pending refunds. If not, this is a backend issue -- but since the reading room uses an external Express API, the filtering logic lives in the backend controller. The frontend passes `status: 'pending'` which the backend should use to return only expired+unrefunded records.
- For the frontend title fix, update line 178 to use the `status` prop for the title.

### Technical Details

| File | Line(s) | Change |
|------|---------|--------|
| `src/pages/admin/DepositAndRestrictionManagement.tsx` | 37 | "Refund Management" -> "Refund Pendings" |
| `src/pages/admin/HostelDeposits.tsx` | 46 | "Refund Management" -> "Refund Pendings" |
| `src/pages/admin/HostelDeposits.tsx` | 316 | Title: "Refund Management" -> "Refund Pendings" |
| `src/pages/admin/HostelDeposits.tsx` | 240 | Add `&& new Date(b.end_date) < new Date()` filter for pending tab |
| `src/components/admin/RefundManagement.tsx` | 178 | Title: "Refund Management" -> dynamic based on status prop ("Refund Pendings" or "Refunded") |

