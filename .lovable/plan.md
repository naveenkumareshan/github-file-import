

## Fix: "Other Payment" Showing Instead of Actual Payment Method

### Root Cause
`getMethodLabel()` returns "Other Payment" for any `custom_<uuid>` value when no `customLabels` map is passed. Two receipt pages (**MessReceipts**, **LaundryReceipts**) never resolve custom labels from the `partner_payment_modes` table, so all non-cash/non-UPI methods display as "Other Payment".

The Reconciliation approve dialog also doesn't show which payment method was used, making it hard to know which bank to credit.

### Changes

**1. MessReceipts.tsx** — Add custom label resolution
- Import `resolvePaymentMethodLabels`
- Add `paymentLabels` state
- After fetching receipts, call `resolvePaymentMethodLabels(methods)` to resolve `custom_<uuid>` → actual labels (e.g., "SBI UPI", "HDFC Bank")
- Pass `paymentLabels` to `getMethodLabel(r.payment_method, paymentLabels)`

**2. LaundryReceipts.tsx** — Same fix as MessReceipts

**3. Reconciliation.tsx approve dialog** — Show payment method in approve dialog
- Display the resolved payment method label (e.g., "SBI UPI") in the approve dialog so the user can see which method was used and select the correct bank
- The auto-suggestion for linked banks already works for `custom_<uuid>` with `linked_bank_id`

**4. bookingEmailService.ts** — Resolve custom labels before sending
- Currently calls `getMethodLabel(payload.paymentMethod)` without custom labels
- Add a resolution step to look up the label from `partner_payment_modes` if the method is `custom_<uuid>`

### Files to Modify
| File | Change |
|------|--------|
| `src/pages/admin/MessReceipts.tsx` | Add `resolvePaymentMethodLabels` + state + pass labels to `getMethodLabel` |
| `src/pages/admin/LaundryReceipts.tsx` | Same as above |
| `src/pages/admin/Reconciliation.tsx` | Show payment method in approve dialog |
| `src/api/bookingEmailService.ts` | Resolve custom label before sending email |

