

## Align Reading Room & Hostel Deposits UI with Receipts/Bookings Pattern

### Problem
The Reading Room key deposits (`DepositManagement`, `RefundManagement`) and the Hostel deposits (`HostelDeposits`) use a Card-wrapped filter layout with raw HTML `<table>` elements. This is inconsistent with the rest of the admin panel (Receipts, Bookings) which uses:
- Inline compact filters (h-8 inputs, no Card wrapper)
- Summary stats bar (`border rounded-md p-3 bg-card`)
- shadcn `Table/TableHeader/TableBody/TableRow/TableCell/TableHead` components
- Compact text sizing (text-xs throughout)
- Badge for record count in header
- Refresh button in header row

### Changes

**1. `src/components/admin/DepositManagement.tsx`** -- Full rewrite to match Receipts pattern:
- Remove Card-wrapped filters, replace with inline compact filter row (Search input with icon, Select dropdowns, date pickers -- all h-8)
- Add summary stats bar showing: Total Deposits, Pending count, Refunded count
- Replace raw `<table>` with shadcn `Table` components
- Add header row with icon + title + Badge count + Refresh button
- Remove the separate "Apply" button (filters apply reactively)
- Keep pagination at bottom

**2. `src/components/admin/RefundManagement.tsx`** -- Same treatment:
- Inline compact filters
- Summary stats bar
- shadcn `Table` components
- Header with icon + title + Badge + Refresh
- Keep refund Dialog as-is (it works fine)

**3. `src/pages/admin/HostelDeposits.tsx`** -- Both `HostelDepositList` and `HostelRefundManagement` sub-components:
- Same inline filter row pattern
- Summary stats bar
- shadcn `Table` components
- Compact sizing throughout
- Keep refund Dialog as-is

### UI Pattern (matching Receipts.tsx)

```text
[Icon] Title [Badge: N records]                    [Refresh]

|  Total Deposits  |  Pending  |  Refunded  |
|  Rs 50,000       |  Rs 30,000|  Rs 20,000 |

[Search input] [Status select] [From date] [To date] [Clear]

+----------------------------------------------------------+
| Table with shadcn components, text-xs, compact rows      |
+----------------------------------------------------------+
```

### Technical Details

All three files will:
- Import `Table, TableBody, TableCell, TableHead, TableHeader, TableRow` from `@/components/ui/table`
- Import `Badge` from `@/components/ui/badge`
- Import `formatCurrency` from `@/utils/currency`
- Use `useMemo` for filtering (client-side) instead of the "Apply" button pattern
- Remove `Card/CardContent/CardHeader/CardTitle` wrappers from filter sections
- Keep data fetching logic unchanged (reading room deposits still use the external API service, hostel deposits still use Supabase)

