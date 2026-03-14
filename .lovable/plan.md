

# Add Pending/Paid Toggle Buttons to All Due Management Pages

## Current State
All three due management pages (Reading Room, Hostel, Mess) use a `Select` dropdown for status filtering with options like "All Status", "Pending", "Partially Paid", "Paid". The default is `'all'`.

## Change
Replace the status `Select` dropdown with two toggle-style `Button`s: **Pending** and **Paid**. Default to **Pending** so the page opens showing only unpaid dues. Clicking **Paid** shows cleared dues.

- "Pending" button filters: `pending`, `partially_paid`, and `overdue` statuses (any non-paid)
- "Paid" button filters: only `paid` status

## Implementation

### All 3 files: same pattern

1. Change default: `const [filterStatus, setFilterStatus] = useState('pending');`
2. Replace the status `<Select>` with two buttons:
```tsx
<Button size="sm" variant={filterStatus === 'pending' ? 'default' : 'outline'} 
  className="h-8 text-xs" onClick={() => setFilterStatus('pending')}>Pending</Button>
<Button size="sm" variant={filterStatus === 'paid' ? 'default' : 'outline'}
  className="h-8 text-xs" onClick={() => setFilterStatus('paid')}>Paid</Button>
```
3. Update query logic:
   - When `filterStatus === 'pending'`: filter where `status != 'paid'` (or `.neq('status', 'paid')`)
   - When `filterStatus === 'paid'`: filter where `status = 'paid'`

### Files Modified
- `src/pages/admin/DueManagement.tsx` — toggle buttons, default pending, update API call
- `src/pages/admin/HostelDueManagement.tsx` — toggle buttons, default pending, update query
- `src/pages/admin/MessDueManagement.tsx` — toggle buttons, default pending, update query

