

## Three Changes to Booking Form

### 1. Simplify Locker Deposit Section

**Current**: Large Alert box with multi-line text explaining the locker deposit.
**New**: Remove the Alert entirely. Instead, show the locker info inline in the summary card only:
- If mandatory: Show "Locker Deposit (mandatory, refundable): + Rs X" in the summary
- If optional: Show a compact checkbox row: "Add Locker Rs X (refundable)" -- no separate Alert block

**File**: `src/components/seats/SeatBookingForm.tsx` (lines 621-643)

### 2. Make Coupon Inline (No Separate Card)

**Current**: CouponSelection is a full Card component with its own header, padding, and border -- visually heavy.
**New**: Replace the CouponSelection card with a compact inline row inside the summary card, right after "Total Amount":
- A single row: input field + small "Apply" text button (not a full button)
- If coupon applied: show a small green badge with the code and an X to remove
- Remove the separate Card/CardHeader/CardContent wrapper
- Available coupons dropdown stays but rendered compactly

**Files**: 
- `src/components/seats/SeatBookingForm.tsx` -- replace CouponSelection Suspense block with inline coupon UI
- `src/components/booking/CouponSelection.tsx` -- refactor to render compact/inline mode (add a `compact` prop)

### 3. Add Advance Payment Option for Students

**Current**: Advance booking is only available in the partner/vendor flow (VendorSeats.tsx). Student booking always requires full payment.
**New**: When the cabin has `advance_booking_enabled = true`, show a toggle option before the Confirm button:

- Add advance booking fields to the Cabin interface in SeatBookingForm
- Fetch advance settings from the cabin data (already comes from Supabase `cabins` table: `advance_booking_enabled`, `advance_percentage`, `advance_flat_amount`, `advance_use_flat`, `advance_validity_days`)
- Show a checkbox: "Book with advance payment (pay Rs X now, remaining due within Y days)"
- When enabled:
  - Calculate advance amount using cabin settings (percentage or flat)
  - Show: "Advance: Rs X | Remaining Due: Rs Y | Due by: [date]"
  - Create booking with `payment_status: 'advance_paid'` and set the due date
  - Pass advance amount to RazorpayCheckout instead of full amount
- Reuse the same logic pattern from VendorSeats.tsx `advanceComputed`

**Files**:
- `src/pages/BookSeat.tsx` -- add advance fields to Cabin interface
- `src/components/seats/SeatBookingForm.tsx` -- add advance payment toggle, computed values, and pass to booking creation + payment
- `src/api/bookingsService.ts` -- no changes needed (already accepts arbitrary fields via `as any`)

### Technical Summary

**Files to modify:**
1. `src/components/seats/SeatBookingForm.tsx` -- all 3 changes (locker simplification, inline coupon, advance payment)
2. `src/components/booking/CouponSelection.tsx` -- add `compact` prop for inline rendering
3. `src/pages/BookSeat.tsx` -- extend Cabin interface with advance booking fields

