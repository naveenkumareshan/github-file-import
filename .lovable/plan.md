

# Rebuild Admin Payouts Page

## Problem
The current Admin Payouts page (`/admin/payouts`) has two issues:
1. **Wrong data source** -- It calls the old MongoDB-based `adminPayoutService` (axios to `/admin/payouts`), which no longer works since the backend migrated to Lovable Cloud.
2. **Non-standard UI** -- It uses large analytics cards, a bulky filter Card with separate "Fetch Payouts" and "Get Analytics" buttons, and the generic `DataTable` component instead of the standardized compact admin table pattern used elsewhere (e.g., Partner Settlements).

## Solution
Completely rewrite `AdminPayouts.tsx` to:
- Use the **Supabase-based settlement data** (the `settlements` table with partner joins) instead of the old axios-based payout service
- Match the **standardized admin UI pattern**: compact stat cards, single-row inline filters with `text-[11px]` typography, `Table` component with dense rows, and proper S.No. continuity

## Changes

### 1. Rewrite `src/pages/admin/AdminPayouts.tsx`
- Remove all imports/usage of `adminPayoutService` and `DataTable`
- Query the `settlements` table from Supabase directly (same data source as PartnerSettlements but focused on payout-specific view)
- Compact stat row: Total Payable, Pending, Paid, Settlements Count
- Inline filter row: Status dropdown, Partner dropdown, Date From/To inputs -- all in one line, `text-[10px]` labels, `h-8` inputs
- Dense table with columns: S.No., Settlement ID, Partner, Period, Total Collected, Commission, Net Payable, Status, Paid Date, UTR
- Action buttons: View detail, Mark Paid (reusing existing `SettlementDetailDialog`)
- Pagination support with cross-page S.No. continuity

### 2. No database changes needed
The `settlements` table and all related infrastructure already exist and are used by PartnerSettlements.

### 3. No new API services needed
All queries go directly through the Supabase client, joining `settlements` with `partners` for business name display.

## Technical Details

| File | Action |
|------|--------|
| `src/pages/admin/AdminPayouts.tsx` | Full rewrite -- Supabase queries, compact UI matching PartnerSettlements pattern |

The page will query:
```sql
SELECT s.*, p.business_name 
FROM settlements s 
JOIN partners p ON s.partner_id = p.id 
ORDER BY s.created_at DESC
```

Filters applied via `.eq()`, `.gte()`, `.lte()` on status, partner_id, period_start/period_end.

Stats computed from the fetched data or via aggregate queries (count by status, sum of net_payable by status).

