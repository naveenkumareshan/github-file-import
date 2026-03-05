

# Fix Business Performance: Filter Alignment + Financial Category Separation

## Issues

1. **Date filter misaligned**: The `DateFilterSelector` uses `w-[200px]` and default height, while the property selector uses `w-[140px] h-7 text-[11px]`. The wrapper div uses `gap-4` and `flex-col md:flex-row` which doesn't match the compact inline style.

2. **Financial categories mixing RR and Hostel amounts**: Currently in `usePartnerPerformance.ts`:
   - `lockerAmount` = RR `locker_payment` + Hostel `locker_payment` — should be **only RR locker amounts**
   - `securityDeposit` = RR `deposit` + Hostel `deposit` + both `security_deposit` — should be **only Hostel security deposits**
   - `seatFees` and `bedFees` are already correct (RR-only and Hostel-only respectively)
   - `foodCollection` is already correct (Hostel-only)

## Changes

### 1. `src/pages/partner/BusinessPerformance.tsx` — Fix filter alignment

Replace the `DateFilterSelector` wrapper with compact inline styling matching the property selector. Pass a `className` prop or wrap with a container that applies `h-7 text-[11px]` to the inner Select. Since `DateFilterSelector` doesn't accept className, wrap it in a div with CSS overrides or modify the component.

Better approach: Add a `compact` or `className` prop to `DateFilterSelector`.

### 2. `src/components/common/DateFilterSelector.tsx` — Add compact mode

Add optional `compact?: boolean` prop. When true:
- Outer div: `gap-2` instead of `gap-4`
- SelectTrigger: `w-[140px] h-7 text-[11px]` instead of `w-[200px]`
- Custom date buttons: `h-7 text-[11px] w-[120px]`

### 3. `src/hooks/usePartnerPerformance.ts` — Separate financial categories

**Lines 385-387**, split locker and security deposit by source:

```typescript
// Locker = only reading room locker payments
const lockerAmount = sumReceipts(rrCurrent, 'locker_payment');

// Security Deposit = only hostel security deposits
const securityDeposit = sumReceipts(hCurrent, 'deposit') + sumReceipts(hCurrent, 'security_deposit');
```

Same fix for previous period (lines 399-401):
```typescript
const prevLockerAmount = sumReceipts(rrPrev, 'locker_payment');
const prevSecurityDeposit = sumReceipts(hPrev, 'deposit') + sumReceipts(hPrev, 'security_deposit');
```

### Files Changed
- `src/components/common/DateFilterSelector.tsx` — Add `compact` prop
- `src/pages/partner/BusinessPerformance.tsx` — Pass `compact` to DateFilterSelector
- `src/hooks/usePartnerPerformance.ts` — Separate locker (RR-only) and security deposit (Hostel-only)

