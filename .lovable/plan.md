

## Streamline Review & Pay: Merge Terms + Direct Payment

### What Changes
The current booking flow has an unnecessary extra confirmation screen after clicking "Confirm & Proceed to Payment". This plan removes that extra step by moving the terms acceptance and payment button directly into the Review & Pay section (Step 3).

### New Flow
1. **Step 3 (Review & Pay)** -- Shows summary + Reading Room Rules + "I agree to terms" checkbox + Pay button
2. On clicking Pay: Creates booking in database (pending status) and immediately opens Razorpay payment
3. **If payment succeeds** -- Booking confirmed, redirected to confirmation page
4. **If payment fails or dismissed** -- Redirect to My Bookings where the booking shows as "pending" with a 5-minute countdown timer and a "Pay Now" button
5. **After 5 minutes** -- Auto-cancel the booking and release the seat

### Technical Changes

**File: `src/components/seats/SeatBookingForm.tsx`**

1. **Move Terms + Rules into the Review & Pay card** (lines 912-958 area):
   - Add `ReadingRoomRules` component and the "I agree to terms" checkbox directly below the coupon section inside the summary card
   - Change the button from "Confirm & Proceed to Payment" to directly trigger `handleCreateBookingAndPay`

2. **Merge booking creation + payment into one action** (`handleCreateBookingAndPay`):
   - Create the booking (pending status) -- same as current `handleCreateBooking`
   - On success, immediately invoke Razorpay checkout programmatically
   - On Razorpay success: confirm booking, navigate to confirmation
   - On Razorpay failure/dismiss: navigate to My Bookings with a toast saying "Complete payment within 5 minutes"

3. **Remove the second confirmation screen** (lines 973-1095):
   - The `bookingCreated` state-driven view with duplicate summary, terms, timer, and RazorpayCheckout is no longer needed
   - Replace it with a simple "redirecting..." state or remove entirely

4. **Button should be disabled** until `agree` is true (terms accepted)

5. **Integrate RazorpayCheckout programmatically**: Instead of rendering the `RazorpayCheckout` component in the UI, trigger it after booking creation. Use the existing `RazorpayCheckout` component but render it conditionally after booking is created, auto-triggering payment.

**File: `src/components/booking/BookingsList.tsx`** (already has the infrastructure)
- Already shows pending bookings with `PaymentTimer` (5 min) and `RazorpayCheckout` for retry
- Already has `handlePaymentExpiry` that shows expiry toast
- No changes needed here -- it already supports the "pay within 5 minutes" flow

**File: `src/api/bookingsService.ts`** (if needed)
- Verify that the auto-cancel logic works: when the timer expires and the student doesn't pay, the booking should be cancelled and seat released
- Currently `handlePaymentExpiry` in `BookingsList` just shows a toast but doesn't actually cancel. Need to add an API call to cancel the booking on expiry.

**File: `src/components/booking/BookingsList.tsx`**
- Update `handlePaymentExpiry` to actually call `bookingsService.cancelBooking(bookingId)` to cancel and release the seat after 5 minutes

### Summary of UI Changes
- **Before**: Review & Pay summary -> Click "Confirm" -> New screen with duplicate summary + terms + timer + payment
- **After**: Review & Pay summary + terms checkbox + "Pay Now" button -> Creates booking + opens Razorpay immediately -> On failure, go to My Bookings (5 min window)

### Files Modified

| File | Change |
|------|--------|
| `src/components/seats/SeatBookingForm.tsx` | Move terms/rules into Step 3 card, merge create+pay, remove second confirmation screen |
| `src/components/booking/BookingsList.tsx` | Add actual booking cancellation on timer expiry |

