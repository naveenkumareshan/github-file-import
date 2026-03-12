

# Make Transaction ID Mandatory for All Non-Cash Payments

## Problem
Currently, the Transaction ID field only appears and is required for UPI/Bank Transfer/Custom methods. The user wants it mandatory for **all** non-cash payment methods across all partner/employee booking and due collection flows.

## Approach
Use the existing `requiresTransactionId` helper but change it to match all non-cash methods. Then update all conditional checks across 6 files.

### 1. `src/components/vendor/PaymentMethodSelector.tsx` (line 186-187)
Change `requiresTransactionId` to treat ALL non-cash methods as requiring a transaction ID:
```typescript
export const requiresTransactionId = (method: string) => method !== 'cash';
```

### 2. Update all files to use `requiresTransactionId` instead of inline checks

**Files and changes:**

| File | What to change |
|------|---------------|
| `VendorSeats.tsx` (lines 664, 851, 878, 2021) | Replace `(paymentMethod === 'upi' \|\| paymentMethod === 'bank_transfer')` with `requiresTransactionId(paymentMethod)` in validation, UI conditional, and button disabled logic. Same for `dueCollectMethod`. |
| `HostelBedMap.tsx` (lines 920, 912, 930, 1999) | Same pattern — replace inline checks with `requiresTransactionId()` for booking and due collection flows. |
| `RenewalSheet.tsx` (lines 145, 425, 448) | Replace inline checks with `requiresTransactionId(paymentMethod)`. |
| `DueManagement.tsx` (line 384) | Already uses the right conditional but add validation before `collectDuePayment` call (~line 137): block if non-cash and no txnId. |
| `HostelDueManagement.tsx` (line 456) | Same — add validation before due collection (~line 200): block if non-cash and no txnId. |
| `CheckInFinancials.tsx` (line 200) | Already shows field for `requiresTransactionId`. Add validation: if non-cash and `!txnId.trim()`, show toast and return. |

### 3. Add validation in submission handlers
In every `handleCollect` / `handleCreateBooking` that accepts a payment method, add:
```typescript
if (requiresTransactionId(method) && !txnId.trim()) {
  toast({ title: 'Transaction ID is required for non-cash payments', variant: 'destructive' });
  return;
}
```

This covers 6 files with a consistent pattern, all driven by the single `requiresTransactionId` helper.

