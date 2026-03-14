

# Fix: Dues with 0 remaining should appear under "Paid" tab

## Problem
Dues where `due_amount = 0` or `paid_amount >= due_amount` still have `status = 'pending'` in the database. The filter `.neq('status', 'paid')` only checks the DB status column, so these zero-remaining dues show up under "Pending" instead of "Paid".

## Solution
Add a **client-side post-filter** after fetching data: any due where `remaining <= 0` should be moved to the "Paid" group regardless of DB status.

### All 3 files: same pattern

After fetching and before setting state, add:

```tsx
// Post-filter: treat zero-remaining dues as paid
if (filterStatus === 'pending') {
  filteredDues = filteredDues.filter(d => (d.due_amount || 0) - (d.paid_amount || 0) > 0);
} else if (filterStatus === 'paid') {
  // Also include dues where remaining is 0 even if DB status isn't 'paid'
  // Re-fetch without status filter, then filter client-side
}
```

Since the "Paid" tab uses `.eq('status', 'paid')` at DB level, zero-remaining dues with `status='pending'` won't appear there either. The cleanest fix:

1. **Remove DB-level status filter** — fetch all dues regardless of status
2. **Apply status filter client-side** based on actual remaining amount:
   - "Pending": `(due_amount - paid_amount) > 0`
   - "Paid": `(due_amount - paid_amount) <= 0 OR status === 'paid'`

### Files
- `src/pages/admin/DueManagement.tsx` — update `vendorSeatsService.getAllDues` call + post-filter
- `src/api/vendorSeatsService.ts` — update `getAllDues` to filter by remaining amount instead of status field
- `src/pages/admin/HostelDueManagement.tsx` — client-side remaining-based filter
- `src/pages/admin/MessDueManagement.tsx` — client-side remaining-based filter

