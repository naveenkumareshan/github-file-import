

## Update Student Booking Details - Remove Validity, Add Discount to Payment Summary

### What Changes
1. **Remove the entire "Validity" section** from the student booking details page
2. **Add Discount row** to Payment Summary - show discount amount if `discount_amount > 0` in the booking, displayed as a green deduction line
3. **Revise Payment Summary layout** to show the price breakdown clearly: Seat Price + Locker (if any) - Discount (if any) = Total Price

### Technical Details

**File: `src/pages/students/StudentBookingView.tsx`**

- **Remove lines 209-234** (the entire Validity collapsible section including Shield icon, End Date, Days Left, Expired/Expiring Soon badges)
- **Remove unused imports**: `Shield`, `AlertTriangle` (no longer needed)
- **Add discount calculation**: Read `booking.discount_amount` (already in DB) and show a row "Discount" with green text and minus sign when > 0
- **Revised Payment Summary order**:
  1. Seat Price -- `₹X`
  2. Locker (if `locker_included`) -- `₹X`
  3. Discount (if `discount_amount > 0`) -- `-₹X` in green
  4. Total Price -- bold `₹X`
  5. Total Paid -- green `₹X`
  6. Due Remaining -- red if > 0
  7. Payment Status badge
  8. Pay Due button (if due > 0)

### Files to Modify
- `src/pages/students/StudentBookingView.tsx` -- remove Validity section, add discount row to Payment Summary

