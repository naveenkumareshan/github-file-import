

## 1. Pay Due Button - Student Side Razorpay Payment

### Current State
The "Pay Due" button on `StudentBookingView` currently shows a toast saying "contact the reading room." It needs to trigger an actual Razorpay payment flow so students can self-serve due clearance.

### Changes

**File: `src/pages/students/StudentBookingView.tsx`**
- Add Razorpay script loader (reuse pattern from `BookingRenewal.tsx`)
- Replace the toast-based "Pay Due" button with a real payment flow:
  1. Click "Pay Due" -> call `razorpay-create-order` edge function with `amount = dueRemaining`, `bookingId = booking.id`
  2. Open Razorpay checkout modal
  3. On success -> call `razorpay-verify-payment` edge function
  4. Create a receipt in the `receipts` table with `receipt_type: 'due_payment'`
  5. Update the `dues` record: increment `paid_amount` by the paid amount, recalculate `due_amount`, update status to `paid` if fully cleared
  6. Refresh booking data and receipts on screen
- Add loading state for payment processing
- Also fetch the `dues` record for this booking to know the due_id (needed for updating dues table)

**File: `supabase/functions/razorpay-create-order/index.ts`**
- No changes needed -- it already accepts any `bookingId` and `amount`

---

## 2. Add Existing Dues to Renewal Amount

### Current State
`BookingRenewal.tsx` calculates the renewal amount purely from `seatPrice * months - coupon discount`. It does not consider any outstanding dues on the current booking.

### Changes

**File: `src/components/booking/BookingRenewal.tsx`**
- On dialog open, fetch outstanding dues for the current booking:
  ```typescript
  const { data: dueData } = await supabase
    .from('dues')
    .select('id, due_amount, status')
    .eq('booking_id', booking.id || booking._id)
    .in('status', ['pending', 'partial'])
    .maybeSingle();
  ```
- Store `outstandingDue` amount in state
- In `calculateAdditionalAmount()`: add `outstandingDue` to the final amount
- In the Extension Summary UI: show a "Previous Due Carried Forward" row with the outstanding amount (in red)
- In `handlePaymentSuccess()`: after creating the renewal booking, if there was an outstanding due:
  - Update the old dues record to `paid` status (since it's now included in the renewal payment)
  - Create a receipt against the old booking for the due amount portion
  - Create the renewal receipt for the renewal portion

### Technical Details

**Due payment flow (StudentBookingView):**
```text
Student clicks "Pay Due ₹X"
  -> razorpay-create-order (amount=dueRemaining, bookingId=booking.id)
  -> Razorpay modal opens
  -> Student pays
  -> razorpay-verify-payment
  -> INSERT receipt (booking_id, amount, receipt_type='due_payment')
  -> UPDATE dues SET paid_amount += X, due_amount -= X, status = 'paid' if due_amount = 0
  -> Refresh UI
```

**Renewal with dues carry-forward:**
```text
Renewal amount = (seatPrice * months) - couponDiscount + outstandingDue
Extension Summary shows:
  - Seat Price x N months: ₹X
  - Discount: -₹Y (if coupon)
  - Previous Due: +₹Z (if any, in red)
  - Final Amount: ₹Total
```

### Files to Modify
- `src/pages/students/StudentBookingView.tsx` -- wire up Razorpay payment for dues
- `src/components/booking/BookingRenewal.tsx` -- fetch and add outstanding dues to renewal amount

