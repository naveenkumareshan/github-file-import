

# Fix: Ensure All Student Bookings Start as Pending Until Payment Succeeds

## Problem
The **Reading Room (cabin/seat)** booking flow in `SeatBookingForm.tsx` sets `payment_status: "advance_paid"` at booking creation time when advance payment is selected — before the student actually pays. This is the same class of bug that was just fixed for hostels.

The hostel flow was already fixed in the previous change. The reading room flow still has this issue.

## What Changes

### 1. `src/components/seats/SeatBookingForm.tsx`
- Line 533: Change `payment_status: useAdvancePayment ? "advance_paid" : "pending"` to always use `"pending"`
- The payment status should only be updated by the `razorpay-verify-payment` edge function after successful payment

### 2. `supabase/functions/razorpay-verify-payment/index.ts`
- For reading room bookings (non-hostel, non-laundry): after signature verification, check if the booking has `advance_amount > 0` and `advance_amount < total_price` — if so, set `payment_status` to `"advance_paid"` instead of `"completed"`
- Currently it always sets `"completed"` for reading room bookings, which would lose the advance payment tracking

### 3. No database migration needed
- The hostel booking data fix was already applied. Reading room bookings use `payment_status` (not a separate `status` column), so no structural changes needed.

## Flow After Fix

```text
Student selects seat → Creates booking (payment_status: "pending")
  → Razorpay modal opens
    → Payment succeeds → Edge function verifies → Sets "completed" or "advance_paid"
    → Payment dismissed → onDismiss cancels booking → Sets "cancelled"
    → Browser closed → Booking stays "pending" (no seat blocked for future bookings)
```

## Files Changed
1. **`src/components/seats/SeatBookingForm.tsx`** — Always create with `payment_status: "pending"`
2. **`supabase/functions/razorpay-verify-payment/index.ts`** — Handle advance payment detection for reading room bookings

