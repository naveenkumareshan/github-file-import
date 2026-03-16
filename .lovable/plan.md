

## Fix: Laundry Review Step + Razorpay Payment Flow

### Problem
1. No review/summary screen before payment — students click "Pay" directly from the item list with no chance to verify their order
2. Razorpay SDK script is never loaded (`loadRazorpayScript()` is missing), so `new Razorpay()` will fail in production
3. No `ondismiss` handler for when user closes the payment modal — pending order left dangling

### Solution

**File:** `src/pages/LaundryDetail.tsx`

#### Add Review Step (2-step flow)
- Add a `step` state: `'select'` → `'review'`
- When user clicks bottom bar button in `select` step, transition to `review` step
- Review step shows: order summary (items + quantities + prices), pickup details (date, slot, address), total amount
- "Confirm & Pay ₹X" button on review step triggers Razorpay
- Back button on review returns to `select`

#### Fix Razorpay Integration
- Add `loadRazorpayScript()` function (same pattern as `RazorpayCheckout.tsx`)
- Add `ondismiss` handler to cancel/cleanup pending order
- Add `modal.animation` and `modal.backdropclose` options
- Add proper error handling for script load failure

### Changes (single file)

**`src/pages/LaundryDetail.tsx`:**

1. Add `step` state (`'select' | 'review'`)
2. Bottom bar in select mode: "Review Order →" button (replaces "Pay ₹X")
3. New review section: card showing all cart items, pickup date/slot, address, total
4. Bottom bar in review mode: "Confirm & Pay ₹{total}" button
5. Add `loadRazorpayScript()` before `new Razorpay()`
6. Add `ondismiss` handler with toast + order cancellation
7. Move `handleSubmit` logic to only run from review step

### UI Flow
```text
Select Items → Fill Address/Date → [Review Order →]
  → Review Screen (summary card) → [Confirm & Pay ₹X]
    → Razorpay SDK opens → Payment → Confirmation Screen
```

### Review Screen Layout
- Header: "Review Your Order" with back arrow
- Items card: each item with name, qty, subtotal
- Pickup card: date, time slot, address
- Total bar at bottom with "Confirm & Pay ₹{total}"

