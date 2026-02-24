

## Fix: Make Seat Price Read-Only

The "Seat Amount" input is currently editable, allowing partners to change the seat price. It should be **fixed/read-only** -- partners can only apply discounts, not modify the base price.

### Change

**File: `src/pages/vendor/VendorSeats.tsx` (line 779)**

Make the Seat Amount input read-only by adding `readOnly` and styling it as disabled:

```text
Before: <Input ... value={bookingPrice} onChange={e => setBookingPrice(e.target.value)} />
After:  <Input ... value={bookingPrice} readOnly className="h-8 text-xs bg-muted cursor-not-allowed" />
```

This removes the `onChange` handler so the price cannot be changed, and adds a muted background to visually indicate it is not editable.

| File | Line | Change |
|------|------|--------|
| `src/pages/vendor/VendorSeats.tsx` | 779 | Add `readOnly`, remove `onChange`, add disabled styling |

One-line change.

