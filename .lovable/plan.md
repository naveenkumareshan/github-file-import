

## Show Transaction ID and Notes on Admin Receipts Table

### Problem
The admin Receipts page at `/admin/receipts` fetches `transaction_id` and `notes` from the database but does not display them in the table. The data is available in the `ReceiptRow` interface (line 27) but no column renders it.

### Fix

**File: `src/pages/admin/Receipts.tsx`**

Add a "Txn ID / Notes" column to the receipts table:

1. Add a new `<TableHead>` for "Txn ID / Notes" after the "Collected By" column (around line 230).
2. Add a corresponding `<TableCell>` in each row that displays:
   - The `transaction_id` if present
   - The `notes` if present (on a second line, muted)
   - A dash "-" if neither exists
3. Update the `colSpan` values in the empty/loading rows from 9 to 10.

### Result
Every receipt in the admin table will show its transaction ID (for online/Razorpay payments) or notes/remarks (for manual cash/UPI collections) in a dedicated column.
