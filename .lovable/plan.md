

## Plan: Remove Decimals from All Currency Display

### Root Cause
`formatCurrency` in `src/utils/currency.ts` uses `maximumFractionDigits: 2`, which shows decimals like ₹577,874.333. Also `roundPrice` rounds to 2 decimal places.

### Fix — Single file: `src/utils/currency.ts`

1. Change `maximumFractionDigits: 2` → `maximumFractionDigits: 0` in `formatCurrency`
2. Update `roundPrice` to round to nearest whole number: `Math.round(amount)`

Since `formatCurrency` is the centralized formatting function used across all pages (admin, partner, employee, student), this single change fixes it everywhere — dashboard stats, invoices, receipts, booking details, payment screens, etc.

