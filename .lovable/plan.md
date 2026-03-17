

## Plan: Fix Single Payment Mode — Auto-sync Amount

### Problem
When only one payment mode is used, the amount input is hidden (`splits.length > 1` check on line 102). If `totalAmount` changes after the split was created, the single split's amount becomes stale and `validateSplits` fails because the split total no longer matches `totalAmount`. This prevents the "Confirm Payment" button from appearing.

### Fix — Single file: `src/components/payment/SplitPaymentCollector.tsx`

Add a `useEffect` that auto-syncs the single split's amount with `totalAmount` whenever there is exactly one split:

```tsx
useEffect(() => {
  if (splits.length === 1 && totalAmount > 0) {
    const currentAmt = parseFloat(splits[0].amount || '0');
    if (Math.abs(currentAmt - totalAmount) > 0.01) {
      onSplitsChange([{ ...splits[0], amount: String(totalAmount) }]);
    }
  }
}, [totalAmount, splits.length]);
```

This ensures that when only one payment method is selected, its amount always matches the required total — so validation passes and the confirm button appears.

No other files need changes.

