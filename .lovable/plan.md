
## Reusable Admin Table Pagination Component

### Overview
Create a single reusable `AdminTablePagination` component that replaces all the duplicated inline pagination code across 10+ admin pages. It provides: S.No. column support, page numbers, prev/next buttons, rows-per-page selector (10/25/50/100), and "Showing X-Y of Z entries" display.

### New Component

**`src/components/admin/AdminTablePagination.tsx`**

A reusable component accepting:
- `currentPage` -- current page number
- `totalItems` -- total record count
- `pageSize` -- current rows per page (default: 10)
- `onPageChange(page)` -- callback when page changes
- `onPageSizeChange(size)` -- callback when rows-per-page changes
- `pageSizeOptions` -- array of options (default: [10, 25, 50, 100])

Renders:
- Left: "Showing 11-20 of 148 entries"
- Center: Page number buttons (1, 2, ... , N) with ellipsis for large ranges
- Right: "Rows per page" dropdown (10/25/50/100)
- Prev/Next buttons

Also exports a helper function `getSerialNumber(index, currentPage, pageSize)` that returns the correct S.No. across pages (e.g., page 2 with pageSize 10 starts at 11).

### Integration Plan

Replace inline pagination in all these admin pages/components:

| # | File | Current Pagination |
|---|------|--------------------|
| 1 | `src/components/admin/DepositManagement.tsx` | Inline Prev/Next (lines 172-186) |
| 2 | `src/components/admin/RefundManagement.tsx` | Inline Prev/Next (lines 260-274) |
| 3 | `src/pages/admin/HostelDeposits.tsx` | Two instances: HostelDepositList (lines 169-181) and HostelRefundManagement (lines 368-380) |
| 4 | `src/pages/AdminBookings.tsx` | PaginationPrevious/Next with page numbers (lines 190-220) |
| 5 | `src/components/admin/AdminBookingsList.tsx` | PaginationPrevious/Next with page numbers (lines 559-650) |
| 6 | `src/pages/admin/ReviewsManagement.tsx` | Inline Prev/Next (lines 350-370) |
| 7 | `src/pages/admin/HostelReceipts.tsx` | Inline pagination |
| 8 | `src/pages/admin/Receipts.tsx` | Inline pagination |
| 9 | `src/components/admin/ErrorLogManagement.tsx` | Inline Prev/Next (lines 536-560) |
| 10 | `src/components/admin/reports/BookingTransactions.tsx` | PaginationPrevious/Next with per-page selector |
| 11 | `src/pages/hotelManager/AdminHostelBookings.tsx` | PaginationPrevious/Next with page numbers |

For each page:
1. Add S.No. as the first `TableHead` column
2. Add S.No. cell in each row using `getSerialNumber(index, page, pageSize)`
3. Replace inline pagination with `<AdminTablePagination />` 
4. Change default page size from 15 to 10
5. Add `pageSize` state and wire `onPageSizeChange` to reset page to 1 and re-fetch data
6. For server-side paginated pages (DepositManagement, RefundManagement, AdminBookings, BookingTransactions), the `pageSize` change also triggers API re-fetch with new limit
7. For client-side paginated pages (HostelDeposits, HostelReceipts), the `pageSize` change recalculates the slice

### Technical Details

**Component structure:**
```text
+------------------------------------------------------------------+
| Showing 11-20 of 148 entries    [1][2]...[15]    Rows/page [10 v]|
|                                 [< Prev] [Next >]                |
+------------------------------------------------------------------+
```

**S.No. calculation:**
```
serialNumber = (currentPage - 1) * pageSize + rowIndex + 1
```

**State changes per page:**
- Add `const [pageSize, setPageSize] = useState(10)` 
- Update existing `PAGE_SIZE` constants to use state
- Wire `onPageSizeChange` to reset `currentPage` to 1

**Pages with server-side pagination** (API fetches with page/limit params):
- DepositManagement, RefundManagement, AdminBookings, AdminBookingsList, BookingTransactions, ErrorLogManagement, ReviewsManagement
- These need `pageSize` added to the fetch dependency array

**Pages with client-side pagination** (all data loaded, sliced locally):
- HostelDeposits (both tabs), HostelReceipts, Receipts
- These just need the slice logic updated to use `pageSize` state
