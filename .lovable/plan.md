

## Remove Redundant Headers from Deposit/Refund Tab Content

### Problem
Both the Reading Room and Hostel deposit pages have a page-level header ("Deposits & Refunds" with description) plus tab labels ("Deposits", "Refund Pendings", "Refunded"). But inside each tab's content, there is ANOTHER header row with icon + title + badge + buttons, plus a summary stats bar. This creates visual clutter and wastes vertical space.

### Solution
Remove the duplicate inner header (icon + title + badge) and the summary stats bar from inside each tab content component. Keep only the filters, table, and pagination. Move the Refresh and Export buttons inline with the filters row.

### Changes

**1. `src/components/admin/DepositManagement.tsx` (Reading Room Deposits)**
- Remove lines 87-101: The inner header row (icon + "Key Deposits" + badge + Export/Refresh buttons)
- Remove lines 103-117: The summary stats bar (Total Deposits / Pending / Refunded)
- Move Export and Refresh buttons to the filters row (alongside search + status + date filter)

**2. `src/components/admin/RefundManagement.tsx` (Reading Room Refund Pendings / Refunded)**
- Remove lines 173-185: The inner header row (icon + title + badge + Export/Refresh buttons)
- Remove lines 187-196: The summary stats bar (Total / Records)
- Move Export and Refresh buttons to the filters row

**3. `src/pages/admin/HostelDeposits.tsx` -- HostelDepositList component**
- Remove lines 111-120: The inner header row (icon + "Deposits" + badge + Refresh)
- Remove lines 122-132: The summary stats bar (Total Deposits / Records)
- Move Refresh button to the filters row

**4. `src/pages/admin/HostelDeposits.tsx` -- HostelRefundManagement component**
- Remove lines 314-324: The inner header row (icon + title + badge + Refresh)
- Remove lines 326-336: The summary stats bar (Total Deposits / Records)
- Move Refresh button to the filters row

### Result
Each tab content will start directly with a compact filter row containing: Search input, any dropdowns, date filters, and action buttons (Export/Refresh) -- all on one line. Then immediately the table. This matches a clean, minimal layout without redundant headings.
