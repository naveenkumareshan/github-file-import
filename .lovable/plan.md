

## Fix: Mess Payment Flow — Add Razorpay Integration + Fix RLS

### Problems Identified

1. **RLS violation on `mess_receipts`**: Students have no INSERT policy, so `createMessReceipt()` fails.
2. **No Razorpay integration for mess**: The current `handleSubscribe` directly sets `payment_status: 'completed'` and tries to insert a receipt client-side — unlike hostel/laundry/reading room which use the pending → Razorpay → verify pattern.
3. **Edge function gaps**: `razorpay-create-order` routes mess to `bookings` (wrong table). `razorpay-verify-payment` has no `mess` handling at all.

### Plan

#### 1. Database Migration
- Add INSERT policy on `mess_receipts` for students (`user_id = auth.uid()`) — safety net, though the edge function (admin client) will handle receipt creation.
- No other schema changes needed.

#### 2. Update `razorpay-create-order` Edge Function
- Add `mess` routing: when `bookingType === 'mess'`, update `mess_subscriptions` table with `razorpay_order_id`.

#### 3. Update `razorpay-verify-payment` Edge Function  
- Add `const isMess = bookingType === 'mess'` alongside `isHostel`/`isLaundry`.
- Route to `mess_subscriptions` table for updates.
- On successful verification: update subscription to `payment_status: 'completed'`, `status: 'active'`, and create a `mess_receipts` record (both test mode and real mode).

#### 4. Update `MessDetail.tsx` — Replace direct payment with Razorpay flow
- Change `handleSubscribe` to:
  1. Create subscription with `payment_status: 'pending'`, `status: 'pending'`.
  2. Use `RazorpayCheckout` component (or inline the same pattern) to trigger payment.
  3. On success → navigate to bookings page.
  4. On dismiss → cancel the pending subscription.
- Add success confirmation screen with validity dates (matching hostel/laundry pattern).
- Replace the plain "Pay" button with `RazorpayCheckout` component.

#### 5. Add `razorpay_order_id` column to `mess_subscriptions`
- Database migration to add `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature` columns (if not already present).

### Files Changed

| File | Action |
|------|--------|
| Database migration | Add `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature` to `mess_subscriptions`; add student INSERT policy on `mess_receipts` |
| `supabase/functions/razorpay-create-order/index.ts` | Add `mess` → `mess_subscriptions` routing |
| `supabase/functions/razorpay-verify-payment/index.ts` | Add full `mess` handling (update subscription + create receipt) |
| `src/pages/MessDetail.tsx` | Replace direct payment with Razorpay flow using `RazorpayCheckout`; add success screen |

