
Goal: ensure the exact selected payment method is saved and shown everywhere (receipts, dialogs, invoice/email), instead of showing default/raw values.

1) Root-cause fixes (data correctness)
- Normalize synthetic fallback cash values before save:
  - Treat `custom___default_cash__` as canonical `cash`.
  - Apply in all payment submit flows (reading room booking/due, hostel booking/due, mess booking/due/renew).
- Ensure single-split amount is initialized to the actual collectable amount (not `0`) when payment step opens/amount changes.
  - This prevents accidental default-first-split behavior and wrong method persistence.

2) Display fixes (UI consistency)
- Harden label resolver:
  - In `src/utils/paymentMethodLabels.ts`, map:
    - `cash` -> Cash
    - any `*__default_cash__*` -> Cash
    - `custom_<uuid>` -> partner label (via `partner_payment_modes` lookup)
- Replace remaining raw method rendering with resolved labels:
  - `src/pages/admin/MessReceipts.tsx` (currently raw/capitalize)
  - `src/pages/admin/MessDueManagement.tsx` (fix incorrect `resolvePaymentMethodLabels(res.ownerId as any)` call; resolve from actual receipt method list)
  - Any remaining receipt/history tables still printing `payment_method` directly.

3) PDF/email receipt text correctness
- `src/utils/invoiceGenerator.ts`:
  - Use resolved/human label passed from caller; avoid falling back to raw `custom_*`.
- `supabase/functions/send-booking-receipt/index.ts` + caller payload preparation:
  - Send/display human-readable method label (not internal id).

4) Payment component correctness
- `src/components/payment/SplitPaymentCollector.tsx`:
  - Use cash/non-cash helper consistently for proof visibility (not `split.method !== 'cash'` literal check).
- Keep transaction ID required only for true non-cash methods (already mostly fixed), including custom cash fallback handling.

5) Files to update (targeted)
- `src/utils/paymentMethodLabels.ts`
- `src/components/payment/SplitPaymentCollector.tsx`
- `src/pages/vendor/VendorSeats.tsx`
- `src/components/admin/RenewalSheet.tsx`
- `src/pages/admin/HostelBedMap.tsx`
- `src/pages/admin/MessBookings.tsx`
- `src/pages/admin/HostelDueManagement.tsx` (if any literal checks remain)
- `src/pages/admin/MessDueManagement.tsx`
- `src/pages/admin/MessReceipts.tsx`
- `src/utils/invoiceGenerator.ts`
- `supabase/functions/send-booking-receipt/index.ts`

6) Validation checklist after implementation
- Take payment with:
  - custom UPI
  - custom bank account
  - custom cash counter
  - fallback cash
- Verify method label is correct in:
  - immediate success/receipt modal
  - receipts list pages (RR/Hostel/Mess)
  - due payment history
  - generated invoice/PDF
  - email receipt content
- Confirm no flow stores `custom___default_cash__` going forward.
