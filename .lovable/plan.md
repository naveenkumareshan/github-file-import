

## Move "Apply Coupon" Below Total Amount

### Current Order (lines 605-711)
1. Step 3 header "Review & Pay"
2. CouponSelection component
3. Locker deposit option
4. Booking Summary (seat price, locker, coupon discount, total)
5. "Confirm & Proceed" button

### New Order
1. Step 3 header "Review & Pay"
2. Locker deposit option
3. Booking Summary (seat price, locker, coupon discount, total)
4. **CouponSelection component** (moved here)
5. "Confirm & Proceed" button

### Technical Changes

**File: `src/components/seats/SeatBookingForm.tsx`**

- Move the `<CouponSelection>` block (lines 614-623) from its current position (right after the step 3 header) to after the summary card (after line 696, before the Confirm button at line 698)
- Keep the step 3 header and separator in place
- No logic changes needed -- just reordering JSX elements

