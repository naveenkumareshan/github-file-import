

# Fix: Reading Room Seat Price vs Deposit Split in Operations Hub

## Problem

In `getFinancials()` (line 179 of `CheckInTracker.tsx`), `price` is set to `b.total_price` which **already includes** the locker/deposit amount. Then `deposit` is added separately as `b.locker_price`, double-counting it.

Example: D Sanjay has `total_price = 2700` (seat 2200 + locker 500) and `locker_price = 500`. Current code shows: Price=2700, Deposit=500, Paid=3200. Should be: Price=2200, Deposit=500, Paid=2700.

## Fix

### `src/components/admin/operations/CheckInTracker.tsx` — Line 179

Change the price calculation to subtract the deposit:

```typescript
// Before
const price = Number(b.total_price || 0);
const deposit = Number(b.locker_price || 0);

// After
const deposit = Number(b.locker_price || 0);
const price = Number(b.total_price || 0) - deposit;
```

This matches the convention used elsewhere in the app where "Seat Price" is the pre-discount base fee excluding deposit.

### Files Changed
- `src/components/admin/operations/CheckInTracker.tsx` — Fix price calculation in `getFinancials`

