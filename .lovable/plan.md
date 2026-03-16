

## Fix: Always Show a Default "Cash" Option in PaymentMethodSelector

### Problem
The `PaymentMethodSelector` component only displays payment modes fetched from the `partner_payment_modes` table. If a partner hasn't explicitly created a Cash counter entry, the Cash option doesn't appear at all — as seen in the screenshot where only Bank and UPI sections are visible.

### Solution

**File:** `src/components/vendor/PaymentMethodSelector.tsx`

After fetching and filtering partner payment modes, inject a default "Cash" option if no cash-type modes exist in the filtered results. This ensures Cash is always available across all modules (Reading Rooms, Hostels, Mess, Laundry).

**Change:** After `filterCashModes` completes (around line 67-73), check if the resulting `filtered` array contains any items with `mode_type === 'cash'`. If not, prepend a default cash entry:

```typescript
// value: 'cash' (not custom_xxx), so it works with existing requiresTransactionId() checks
{ value: 'cash', label: 'Cash', icon: TYPE_ICONS.cash, mode_type: 'cash', details_image_url: null }
```

This is safe because:
- `requiresTransactionId('cash')` already returns `false` (line 186-187)
- `isNonCashMethod('cash')` already returns `false` (line 190)
- The grouped rendering logic already handles `mode_type === 'cash'` display

### Single file change
| File | Change |
|------|--------|
| `src/components/vendor/PaymentMethodSelector.tsx` | Add default Cash fallback after mode filtering |

