

## Fix Advance Payment Display on Payment Page

### Problem
When a student opts for advance payment, the booking is created correctly and the Razorpay checkout receives the correct advance amount (line 915). However, the **payment summary page** (shown after clicking "Confirm & Proceed") still displays:
- "Total Price: Rs X" (full amount) without any advance breakdown
- Button text: "Complete Payment" instead of "Pay Rs Y Advance"

This confuses the student into thinking they're paying the full amount.

### Fix (Single File)

**File: `src/components/seats/SeatBookingForm.tsx`**

In the post-booking-created section (lines 851-928):

1. **Add advance payment breakdown** after "Total Price" line (around line 900):
   - If `useAdvancePayment` is true, show:
     - "Pay Now: Rs {advanceAmount}" (highlighted in primary color)
     - "Remaining Due: Rs {remainingDue}" 
     - "Due By: {dueDate}"
   - This goes between the Total Price line and the ReadingRoomRules section

2. **Update button text** (line 923):
   - Change from static "Complete Payment" to:
     - `useAdvancePayment ? "Pay ₹{advanceAmount} Advance" : "Complete Payment"`

3. **Key deposit display fix** (lines 887-889):
   - Currently always shows `keyDeposit` regardless of whether locker was opted in
   - Should respect `lockerMandatory` and `lockerOptedIn` state (show effective locker deposit)

### No other files need changes
The Razorpay amount prop (line 915) already correctly passes `useAdvancePayment ? advanceAmount : totalPrice`.
