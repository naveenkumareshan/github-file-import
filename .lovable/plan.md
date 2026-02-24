

## Move Discount Inputs Below Discount Label

### Problem
Currently the discount number input and reason input appear above the "Discount (reason) -₹X" line. The user wants them below the "Discount" word.

### Change

**File: `src/pages/vendor/VendorSeats.tsx` (lines 1034-1040)**

Reorder so the layout becomes:
1. "Discount" label line (always visible)
2. Input fields (amount + reason) below it

Replace the current order:
```
[input ₹ Discount] [input Reason]     <-- currently first
Discount (reason)  -₹200              <-- currently second
```

With:
```
Discount                               <-- label always shown
[input ₹ Amount] [input Reason]        <-- inputs below the label
Discount (reason)  -₹200              <-- summary if amount > 0
```

### File Changed

| File | Change |
|------|--------|
| `src/pages/vendor/VendorSeats.tsx` | Add "Discount" label above the input fields (lines 1034-1040) |

