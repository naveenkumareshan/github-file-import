

## Make Discount Inputs Smaller and Compact

### Problem
The discount input fields (amount and reason) are too large and visually mix with the other summary values like Seat Amount and Locker. They should be small and subtle, staying visually below the "Discount" label without dominating the card.

### Change

**File: `src/pages/vendor/VendorSeats.tsx` (lines 1034-1043)**

- Make the discount inputs smaller: reduce height further, use smaller text, and add a subtle style so they don't compete with the summary lines
- Make the discount deduction line (`-₹200`) smaller to match
- Keep the "Discount" label as a small muted text like "Seat Amount" and "Locker" lines

Current:
- Inputs use `h-7 text-[11px]` which is still too big relative to the summary text
- The deduction line text is same size as other values

New:
- Inputs use `h-6 text-[10px]` with muted border styling
- The deduction line uses `text-[10px]` to stay compact
- Overall discount section stays visually small and subordinate

### Technical Details

| File | Lines | Change |
|------|-------|--------|
| `src/pages/vendor/VendorSeats.tsx` | 1034-1043 | Reduce input size to `h-6 text-[10px]`, shrink deduction text, tighten spacing |

