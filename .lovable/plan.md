

# Finance Reconciliation — Unified Bank Reconciliation Page

## Overview
Create a new **Finance** sidebar section with a **Reconciliation** page that aggregates receipts from all 4 modules (Reading Room, Hostel, Mess, Laundry) into one unified view. Finance team can verify each receipt against bank credits and mark them as Approved, Rejected, or Pending.

## Database Changes

### 1. Add `reconciliation_status` column to all 4 receipt tables
- `receipts` → `reconciliation_status text DEFAULT 'pending'`
- `hostel_receipts` → `reconciliation_status text DEFAULT 'pending'`
- `mess_receipts` → `reconciliation_status text DEFAULT 'pending'`
- `laundry_receipts` → `reconciliation_status text DEFAULT 'pending'`

Also add `reconciled_at timestamptz`, `reconciled_by uuid` to each table for audit trail.

### 2. No new tables needed
The reconciliation status lives directly on each receipt — no separate join table.

## New Page: `src/pages/admin/Reconciliation.tsx`

### Data Fetching
Fetch from all 4 receipt tables in parallel, then merge into a unified array:

```typescript
interface ReconciliationRow {
  id: string;
  source: 'reading_room' | 'hostel' | 'mess' | 'laundry';
  serial_number: string;
  amount: number;
  payment_method: string;
  transaction_id: string;
  student_name: string;
  student_phone: string;
  property_name: string;
  booking_serial: string;
  reconciliation_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reconciled_at?: string;
}
```

Query each table, join with `profiles` for student info, join with `cabins`/`hostels`/`mess_partners`/`laundry_partners` for property name.

### UI Layout
- **3 Tabs**: Pending | Approved | Rejected (with counts as badges)
- **Filters**: Date range (DateFilterSelector), Source module dropdown (All/Reading Room/Hostel/Mess/Laundry), Payment method, Search (name/phone/txn ID/receipt#)
- **Summary bar**: Total amount for current tab/filter
- **Table columns**: S.No, Receipt#, Source (badge), Student (name+phone), Property, Amount, Method, Txn ID, Payment Date, Action (Approve/Reject buttons for pending tab)
- **Mobile**: Card layout via `isMobile` check (same pattern as existing Receipts page)
- **Bulk actions**: Select all + bulk approve for efficiency
- **Export CSV** button

### Approve/Reject Flow
- Click Approve → updates `reconciliation_status = 'approved'`, `reconciled_at = now()`, `reconciled_by = auth.uid()` on the correct source table
- Click Reject → shows a small reason input, then updates `reconciliation_status = 'rejected'`
- Row moves to the corresponding tab immediately (optimistic update)

## Sidebar Addition

In `AdminSidebar.tsx`, add a **Finance** collapsible group (after Partners for admin, or after Earnings for partners):

```typescript
{
  title: 'Finance',
  icon: Wallet, // or Landmark
  roles: ['admin', 'vendor', 'vendor_employee'],
  subItems: [
    { title: 'Reconciliation', url: `${routePrefix}/reconciliation`, icon: ClipboardCheck }
  ]
}
```

## Routing

Add to both admin and partner route blocks in `App.tsx`:
```typescript
<Route path="reconciliation" element={<Reconciliation />} />
```

## Files to Create/Modify

| File | Change |
|---|---|
| DB Migration | Add `reconciliation_status`, `reconciled_at`, `reconciled_by` to 4 receipt tables |
| `src/pages/admin/Reconciliation.tsx` | **New** — full reconciliation page with tabs, filters, table |
| `src/components/admin/AdminSidebar.tsx` | Add Finance section with Reconciliation link |
| `src/App.tsx` | Add route for both `/admin/reconciliation` and `/partner/reconciliation` |

