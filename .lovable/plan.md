

## Fix: Transaction ID Not Required for Cash

### Problem
The `requiresTransactionId` function in `PaymentMethodSelector.tsx` only checks for exact string `'cash'`, but when using custom payment modes, the cash value is stored as `custom___default_cash__`. This causes the transaction ID field to incorrectly appear for cash payments.

### Solution
Update the `requiresTransactionId` function to also recognize custom cash modes by checking if the method value contains the default cash pattern.

**File:** `src/components/vendor/PaymentMethodSelector.tsx`

Change line 189-190 from:
```typescript
export const requiresTransactionId = (method: string) =>
  !!method && method !== 'cash';
```

To:
```typescript
export const requiresTransactionId = (method: string) => {
  if (!method) return false;
  // Cash methods: 'cash' (legacy) or custom___default_cash__ (default cash option)
  const isCash = method === 'cash' || method.includes('__default_cash__');
  return !isCash;
};
```

### Files to modify
| File | Change |
|------|--------|
| `src/components/vendor/PaymentMethodSelector.tsx` | Update `requiresTransactionId` to recognize custom cash modes |

This fix ensures:
- Legacy `'cash'` value returns `false` (no txn ID needed)
- Default cash option `custom___default_cash__` returns `false` (no txn ID needed)
- All other methods (UPI, Bank, etc.) return `true` (txn ID required)

