

# Fix: Display Custom Payment Method Labels Instead of Raw IDs

## Problem
When partners create bookings using custom payment modes (e.g., "ICICI Bank 303"), the system stores the value as `custom_<uuid>` in the `payment_method` column. All display components have `methodLabel()` functions that only map `cash`, `upi`, `bank_transfer`, `online` — and fall through to showing the raw `custom_<uuid>` string for custom modes.

## Solution
There's already a `getPaymentMethodLabel()` utility in `PaymentMethodSelector.tsx` that accepts custom modes. The fix is to:

1. **Create a shared utility** that resolves `custom_<uuid>` payment method values to their human-readable labels by querying the `partner_payment_modes` table, extracting the UUID from the `custom_` prefix and looking up the label.

2. **Update all `methodLabel` functions** across these files to resolve custom payment modes:
   - `src/pages/admin/Receipts.tsx`
   - `src/pages/admin/HostelReceipts.tsx`
   - `src/components/booking/BookingTransactionView.tsx`
   - `src/components/booking/DuePaymentHistory.tsx`
   - `src/components/booking/HostelDuePaymentHistory.tsx`

## Approach
Rather than making each component fetch custom modes individually, batch-resolve all `custom_*` payment method values in each component's data fetch:

- After fetching receipts/payments, collect all unique `custom_*` payment_method values
- Extract the UUIDs (strip `custom_` prefix)
- Query `partner_payment_modes` table for those IDs in one call
- Build a lookup map `{ "custom_<uuid>": "ICICI Bank 303" }`
- Use this map in the display logic

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/admin/Receipts.tsx` | After fetching receipts, resolve custom payment method IDs to labels; update `methodLabel` to use lookup map |
| `src/pages/admin/HostelReceipts.tsx` | Same pattern |
| `src/components/booking/BookingTransactionView.tsx` | After fetching receipts, resolve custom IDs; display label instead of raw value |
| `src/components/booking/DuePaymentHistory.tsx` | After fetching payments, resolve custom IDs; update `methodLabel` |
| `src/components/booking/HostelDuePaymentHistory.tsx` | Same pattern |

## Key Logic

```typescript
// Shared resolution pattern used in each component
const resolvePaymentMethodLabels = async (methods: string[]): Promise<Record<string, string>> => {
  const customIds = methods
    .filter(m => m.startsWith('custom_'))
    .map(m => m.replace('custom_', ''));
  if (customIds.length === 0) return {};
  const { data } = await supabase
    .from('partner_payment_modes')
    .select('id, label')
    .in('id', customIds);
  const map: Record<string, string> = {};
  data?.forEach(m => { map[`custom_${m.id}`] = m.label; });
  return map;
};

// Updated methodLabel
const methodLabel = (m: string) => {
  const defaults: Record<string, string> = {
    cash: 'Cash', upi: 'UPI', bank_transfer: 'Bank Transfer', online: 'Online'
  };
  if (defaults[m]) return defaults[m];
  if (paymentLabels[m]) return paymentLabels[m]; // from resolved map
  return m;
};
```

