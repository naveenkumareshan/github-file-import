

# Add Coupon "Applies To" Option and Fix Negative Seat Price Display

## Problem Summary

1. **No control over what coupon discount applies to**: Admins/partners cannot specify if a coupon discount should apply to seat fees only, locker deposit only, or both. Currently all discounts blindly reduce the total.

2. **Negative seat prices in listings**: The admin "All Transactions" view calculates seat price as `totalPrice - lockerPrice`. When a discount is applied, `totalPrice` is already reduced, so this subtraction produces negative seat amounts (e.g., "Seat: -₹233"). The discount should be distributed properly: first reduce seat fees, then overflow to locker deposit. The locker refund should only refund the actual locker amount after discount allocation.

## Solution

### Database Change
Add a new column `applies_to` to the `coupons` table with values: `fees_only`, `locker_only`, or `both` (default: `fees_only`).

```sql
ALTER TABLE public.coupons
ADD COLUMN applies_to text NOT NULL DEFAULT 'fees_only';
```

### File Changes

#### 1. `src/components/admin/CouponManagement.tsx`
- Add an "Applies To" dropdown in the coupon create/edit form with options: "Fees Only", "Locker Only", "Both"
- Default to "Fees Only"
- Include `applies_to` in formData, resetForm, and openEditDialog

#### 2. `src/api/couponService.ts`
- Add `applies_to` field to `CouponData` interface (`'fees_only' | 'locker_only' | 'both'`)
- Include `applies_to` in createCoupon and updateCoupon data mapping
- Include `applies_to` in validateCoupon response so the booking form knows how to apply it

#### 3. `src/api/adminBookingsService.ts` (Fix negative seat price)
- Line 122: Change the seat price calculation to properly account for discount:
  ```
  // Instead of: seatPrice = totalPrice - lockerPrice
  // Use: seatPrice = totalPrice - lockerPrice + discountAmount
  // Then cap: seatPrice = max(0, baseSeatPrice - discountOnSeat)
  ```
- Read `discount_amount` from the booking record
- Calculate: `baseSeatPrice = totalPrice - lockerPrice + discountAmount` (reconstructs pre-discount seat price, since totalPrice = baseSeat - discount + locker)
- Wait -- actually `totalPrice = base - discount + locker`, so `totalPrice - locker = base - discount`. The correct display should be `base` for seat and show discount separately, OR properly split the discount.

**Better approach**: Store and display the amounts correctly:
- `seatPrice` (display) = the raw seat fee before discount = `totalPrice + discountAmount - lockerPrice`  
- Then show discount separately
- This way seat price is always positive

#### 4. `src/pages/AdminBookings.tsx` (Fix display)
- Line 208: Update the Seat price calculation to: `(b.totalPrice || 0) + (b.discountAmount || 0) - (b.lockerPrice || 0)` to show the pre-discount seat fee
- Add discount display line if discount > 0: `Discount: -₹XX`

#### 5. `src/pages/AdminBookingDetail.tsx`
- Line 255: Fix seatPrice for cabin bookings to use the reconstructed pre-discount value
- The payment grid already shows discount separately, so just fix the seat line

#### 6. `src/pages/vendor/VendorSeats.tsx`
- Update the `computedTotal` calculation to respect `applies_to` from coupon data if available
- When coupon `applies_to` is `fees_only`: discount only from seat fees, locker stays full
- When `locker_only`: discount only from locker, fees stay full  
- When `both`: discount from combined total (current behavior)

#### 7. `src/components/seats/SeatBookingForm.tsx`
- Same logic as VendorSeats: when a coupon is applied, check its `applies_to` field and distribute the discount accordingly

#### 8. `src/pages/StudentDashboard.tsx`
- Line 490: Fix "Seat: ₹X" display to use `total_price + discount_amount - locker_price` instead of just `total_price`

## Summary of All File Changes

| File | Change |
|------|--------|
| **Migration** | Add `applies_to` column to `coupons` table |
| `CouponManagement.tsx` | Add "Applies To" dropdown in coupon form |
| `couponService.ts` | Add `applies_to` to interfaces, CRUD, and validation response |
| `adminBookingsService.ts` | Fix seatPrice = totalPrice + discountAmount - lockerPrice |
| `AdminBookings.tsx` | Fix seat price display, add discount line |
| `AdminBookingDetail.tsx` | Fix seatPrice calculation for cabin bookings |
| `VendorSeats.tsx` | Respect `applies_to` in total calculation |
| `SeatBookingForm.tsx` | Respect `applies_to` in total calculation |
| `StudentDashboard.tsx` | Fix seat price display |

