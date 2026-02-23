

## Add Test Payment Mode + Fix Build Error

### 1. Fix gl-matrix Build Error

The TypeScript errors come from `gl-matrix` (a dependency of `maplibre-gl`). The fix is to add `"skipLibCheck": true` to `tsconfig.node.json` as well -- or more reliably, exclude `node_modules` from type checking by ensuring `include` only covers `src`.

**File:** `tsconfig.node.json` -- add `skipLibCheck: true`

---

### 2. Add Test Payment Mode to Razorpay Checkout

Since you don't have Razorpay keys yet, add a **simulated test mode** that bypasses Razorpay entirely and directly confirms the booking.

**File: `src/components/payment/RazorpayCheckout.tsx`**

Changes:
- Add a test mode check: if Razorpay keys aren't configured (edge function returns a specific error), fall back to a simulated payment
- In test mode: skip Razorpay SDK loading, directly update booking status to `completed`, show a toast saying "Test Payment - Booking Confirmed", and call `onSuccess`
- This lets you test the full booking flow without real keys

**File: `supabase/functions/razorpay-create-order/index.ts`**

Changes:
- If `RAZORPAY_KEY_ID` or `RAZORPAY_KEY_SECRET` are not set, return a response with `{ testMode: true }` instead of an error
- This signals the frontend to simulate the payment

**File: `supabase/functions/razorpay-verify-payment/index.ts`**

Changes:
- Accept a `testMode: true` flag in the request body
- If test mode, skip signature verification and directly mark booking as confirmed
- Still update the booking record in the database

---

### Technical Details

The flow becomes:

1. Student clicks "Pay Now"
2. Frontend calls `razorpay-create-order` edge function
3. Edge function detects no Razorpay keys -- returns `{ testMode: true }`
4. Frontend skips Razorpay popup, calls `razorpay-verify-payment` with `testMode: true`
5. Edge function updates booking to `payment_status: completed`
6. Frontend shows success toast and redirects

When you add real keys later, the test mode automatically disables and real Razorpay takes over -- no code changes needed.

