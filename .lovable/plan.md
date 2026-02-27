

## Fix: Variable Ordering Bug in HostelRoomDetails.tsx

### Problem
On line 182, `totalPrice` references `discountedPrice`, but `discountedPrice` is defined much later on line 323. JavaScript hoists `const` declarations but does NOT initialize them, so accessing `discountedPrice` before its definition throws a `ReferenceError`, causing the entire page to crash (white screen).

### Root Cause
During the last set of changes, the price calculation block (lines 182-191) was placed before the derived data block (lines 307-326) where `discountedPrice`, `effectiveBasePrice`, `selectedBedPrice`, etc. are actually computed.

### Fix
Move lines 182-191 (the `totalPrice`, `calculateAdvanceAmount`, `advanceAmount`, `payableAmount` block) to AFTER the derived data block (after line 326). This ensures all dependencies are defined before use.

### Corrected Order
```text
Line ~307: selectedBedPrice, effectiveBasePrice, discountedPrice, priceLabel  (existing)
Line ~327: totalPrice = discountedPrice * durationCount                       (moved here)
Line ~328: calculateAdvanceAmount(), advanceAmount, payableAmount             (moved here)
```

Also move `selectedRoom`, `selectedSharingOption`, and `endDate` (lines 193-201) into the same derived data block for consistency, since they are also used later.

### File Changed
- `src/pages/HostelRoomDetails.tsx` — reorder variable declarations so dependencies come first

This is a single-file fix that will restore the page to working order.
