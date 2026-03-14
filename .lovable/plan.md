

# Add Pagination, S.No., and Mess Due Page — Standardization

## Audit Summary

Pages **already have** AdminTablePagination + S.No.: MessBookings, DueManagement, HostelDueManagement, Receipts, HostelReceipts, MessReceipts, ExpiringBookings, HostelExpiringBookings, AdminStudents, BookingActivityLog, Reconciliation, SponsoredListings, MyPromotions, HostelDeposits, MessManagement, RoomManagement.

Pages **missing** pagination and/or S.No.:

| Page | Missing |
|------|---------|
| `PropertyAttendance.tsx` | Pagination, S.No. uses `i+1` instead of `getSerialNumber` |
| `AttendanceHistory.tsx` (student) | Pagination, no S.No. column at all |
| `MessAttendance.tsx` | No table pagination for manual attendance list (subscriber list) |
| `ReviewsManagement.tsx` | Has pagination but review cards have no S.No. numbering |
| `VendorEmployees.tsx` | No pagination, S.No. uses `idx+1` |
| `AdminEmployees.tsx` | No pagination, S.No. uses `idx+1` |
| `PartnerEarnings.tsx` | No pagination on settlements or ledger tables, S.No. uses `idx+1` |
| **Mess Due Management** | **Page does not exist** — dues are handled inline in MessBookings |

## Changes

### 1. Create `src/pages/admin/MessDueManagement.tsx` (NEW)
- Mirror structure of `DueManagement.tsx` / `HostelDueManagement.tsx`
- Query `mess_dues` table with joins to `profiles`, `mess_partners`, `mess_subscriptions`
- Summary cards: Total Due, Overdue, Due Today, Collected This Month
- Filters: mess property, status, search
- Table with S.No., Due ID, Student, Mess, Subscription, Due Amount, Paid, Remaining, Due Date, Status, Actions (Collect, History)
- Collect due Sheet with PaymentMethodSelector
- AdminTablePagination with getSerialNumber
- Add route in `App.tsx`: `mess-due-management`
- Add sidebar link in `AdminSidebar.tsx` and `PartnerMoreMenu.tsx`

### 2. Fix `PropertyAttendance.tsx`
- Add `currentPage`, `pageSize` state
- Slice `records` for pagination
- Replace `{i + 1}` with `getSerialNumber(i, currentPage, pageSize)`
- Add `AdminTablePagination` after table
- Import `AdminTablePagination, getSerialNumber`

### 3. Fix `AttendanceHistory.tsx` (student)
- Add `currentPage`, `pageSize` state
- Add S.No. column header + cell with `getSerialNumber`
- Slice `records` for pagination
- Add `AdminTablePagination` after table

### 4. Fix `MessAttendance.tsx`
- The manual attendance subscriber list: add S.No. numbering to each subscriber card
- No table pagination needed here (it's a card-based attendance marking UI, not a data table)

### 5. Fix `ReviewsManagement.tsx`
- Add S.No. to each review card (prefix the card with a small numbered badge)
- Pagination already exists — just needs serial numbering

### 6. Fix `VendorEmployees.tsx`
- Add `currentPage`, `pageSize` state
- Slice `employees` for pagination
- Replace `{idx + 1}` with `getSerialNumber(idx, currentPage, pageSize)`
- Add `AdminTablePagination` after table

### 7. Fix `AdminEmployees.tsx`
- Same as VendorEmployees: add pagination state, slice, getSerialNumber, AdminTablePagination

### 8. Fix `PartnerEarnings.tsx`
- Add pagination state for settlements tab and ledger tab
- Slice filtered data, replace `{idx + 1}` with `getSerialNumber`
- Add `AdminTablePagination` to both tabs
- Add S.No. column to ledger tab (currently missing)

## Files Modified
- `src/pages/admin/MessDueManagement.tsx` — **NEW**
- `src/App.tsx` — add route
- `src/components/admin/AdminSidebar.tsx` — add menu item
- `src/components/partner/PartnerMoreMenu.tsx` — add menu item
- `src/pages/admin/PropertyAttendance.tsx`
- `src/pages/student/AttendanceHistory.tsx`
- `src/pages/admin/MessAttendance.tsx`
- `src/pages/admin/ReviewsManagement.tsx`
- `src/pages/vendor/VendorEmployees.tsx`
- `src/pages/admin/AdminEmployees.tsx`
- `src/pages/partner/PartnerEarnings.tsx`

