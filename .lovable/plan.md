

# Fix Payment Verification and Receipt Creation

## Root Cause (from edge function logs)

The error log is explicit:

```
"Could not find the 'status' column of 'bookings' in the schema cache"
```

The `razorpay-verify-payment` edge function has **two bugs**:

### Bug 1: Non-existent column
On line 162, the function sets `status: "confirmed"` in the update data for ALL booking types. But the `bookings` table does NOT have a `status` column -- it only has `payment_status`. The `hostel_bookings` table has both `status` and `payment_status`, so it works for hostels but **fails for reading room bookings**.

This means: Razorpay charges the user, signature verification passes, but the database update fails, so the booking stays as "pending" and appears as "Overdue."

### Bug 2: No receipt for reading room bookings
The function creates receipts for hostel bookings (into `hostel_receipts`) and laundry orders (into `laundry_receipts`), but there is **no code** to create a receipt in the `receipts` table for regular reading room/cabin bookings. So even if Bug 1 is fixed, no receipt would appear in the Receipts page.

---

## Fix

### File: `supabase/functions/razorpay-verify-payment/index.ts`

**Change 1 -- Line 160-165**: Build `updateData` conditionally based on booking type. For regular bookings (cabin), only set `payment_status` (no `status` column). For hostel bookings, set both `status` and `payment_status`.

```typescript
// For regular bookings (cabin/reading room) - no 'status' column exists
const updateData: Record<string, any> = {
  payment_status: "completed",
  razorpay_payment_id,
  razorpay_signature,
};

// Only hostel_bookings and laundry_orders have a 'status' column
if (isHostel || isLaundry) {
  updateData.status = "confirmed";
}
```

**Change 2 -- After line 213**: Add receipt creation for regular cabin/reading room bookings (the `!isHostel && !isLaundry` case):

```typescript
// Create receipt for reading room/cabin bookings
if (!isHostel && !isLaundry) {
  const { data: booking } = await adminClient
    .from("bookings")
    .select("cabin_id, seat_id, user_id, total_price")
    .eq("id", bookingId)
    .single();

  if (booking) {
    await adminClient.from("receipts").insert({
      booking_id: bookingId,
      user_id: booking.user_id,
      cabin_id: booking.cabin_id,
      seat_id: booking.seat_id,
      amount: booking.total_price,
      payment_method: "online",
      transaction_id: razorpay_payment_id,
      receipt_type: "booking_payment",
    });
  }
}
```

**Also fix test mode section (lines 56-65)**: The same `status: "confirmed"` bug exists in the test mode path. Apply the same conditional logic there, and add receipt creation for regular bookings in test mode too.

---

## Summary

| Issue | Cause | Fix |
|-------|-------|-----|
| Payment verification fails | `status` column doesn't exist on `bookings` table | Only set `status` for hostel/laundry, not cabin bookings |
| Booking stays "Overdue" | DB update fails so `payment_status` stays "pending" | Same fix -- update will now succeed |
| No receipt created | No code path for regular booking receipts | Add `receipts` table insert for cabin bookings |

### File modified
- `supabase/functions/razorpay-verify-payment/index.ts`

After the fix, the edge function will be redeployed automatically.

