

## Fix Bank Management: Empty Pages + Add Transaction Detail View

### Problems Found

1. **`receipts` query returns 400**: The code filters by `partner_user_id` but that column doesn't exist on `receipts`. It should filter by `cabin_id` using cabin IDs (same pattern as hostel/mess/laundry).

2. **`mess_receipts` and `laundry_receipts` queries return 400**: The code selects `collected_by_name` but that column doesn't exist on these tables. Need to select only columns that exist per table.

3. **`online` payment method miscategorized**: Receipts with `payment_method = 'online'` fall through to `cash` in `resolveType`. They should be categorized as "Online" (separate from cash/bank/UPI).

4. **No detail page**: Clicking a person/bank name should open a dedicated page showing all transactions (credits) and a closing balance.

### Changes

**File: `src/pages/admin/BankManagement.tsx`**

1. Fix receipt fetching:
   - Add cabin IDs query: `cabins.select('id').eq('created_by', partnerId)`
   - Filter `receipts` by `cabin_id IN cabinIds` instead of `partner_user_id`
   - Use different select columns per table — `collected_by_name` only for `receipts` and `hostel_receipts`; for `mess_receipts`/`laundry_receipts` use available columns and default `collected_by_name` to null

2. Fix `resolveType` to handle `online` as its own category (or map to `bank`):
   - Add `if (method === 'online') return 'bank'` — online payments represent digital credits

3. Convert each balance row to a clickable link that navigates to a detail page

4. Add an "All" tab to show the combined view

**New File: `src/pages/admin/BankTransactionDetail.tsx`**

- Route: `/admin/banks/:type/:label` (e.g., `/admin/banks/cash/Ashok`)
- Shows: Full transaction list (all credits) for that person/bank/UPI account
- Columns: Date, Serial Number, Receipt Type, Student Name, Amount
- Footer: Closing Balance (sum of all credits)
- Back button to return to Bank Management

**File: `src/App.tsx` (or routing file)**
- Add route for the new detail page

### Summary
- 3 query bugs fixed (wrong column names)
- Online payments properly categorized
- Click-through detail pages with full transaction lists and closing balances

