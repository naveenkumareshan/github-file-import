

## Fix: Laundry "Review Order" Button Hidden Behind Mobile Nav

### Problem
The bottom action bar in `LaundryDetail.tsx` (containing the "Review Order →" and "Confirm & Pay" buttons) uses `z-10` and `fixed bottom-0`. The `MobileBottomNav` also uses `fixed bottom-0` with `z-50`, completely covering the buttons on mobile.

### Solution

**File: `src/pages/LaundryDetail.tsx`**

Two changes needed:

1. **Increase z-index** of the bottom bar from `z-10` to `z-50` (same level as mobile nav)
2. **Add bottom padding** to account for the mobile nav height (~60px) so the button sits above it — use `bottom-[60px] md:bottom-0` on the fixed bar, and increase the spacer div from `h-24` to `h-40` so content isn't hidden

This applies to both bottom bars:
- **Select step** (line 541): "Review Order →" button
- **Review step** (line 344): "Confirm & Pay" button

Both bars and both spacer divs (line 340 and 536) will be updated.

