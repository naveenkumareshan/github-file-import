

# Payment Proof Upload for Non-Cash Offline Payments

## Summary
Add payment proof (screenshot) upload when collecting non-cash payments (UPI, bank transfer). Skip for cash. Show proof links beside receipt numbers in all booking detail views.

## Database Changes

### 1. Add `payment_proof_url` column to receipt tables
- `receipts` -- add `payment_proof_url TEXT DEFAULT ''`
- `hostel_receipts` -- add `payment_proof_url TEXT DEFAULT ''`
- `due_payments` -- add `payment_proof_url TEXT DEFAULT ''`
- `hostel_due_payments` -- add `payment_proof_url TEXT DEFAULT ''`
- `bookings` -- add `payment_proof_url TEXT DEFAULT ''`
- `hostel_bookings` -- add `payment_proof_url TEXT DEFAULT ''`

### 2. Add `payment_proof_required` setting to property tables
- `cabins` -- add `payment_proof_required BOOLEAN DEFAULT false`
- `hostels` -- add `payment_proof_required BOOLEAN DEFAULT false`

### 3. Storage bucket
- Create `payment-proofs` public bucket with authenticated upload RLS

## New Component

### `src/components/payment/PaymentProofUpload.tsx`
A small reusable component:
- File input accepting images (JPEG, PNG, WebP) with camera capture on mobile
- Uploads to `payment-proofs` bucket
- Shows thumbnail preview with remove option
- Props: `required`, `value`, `onChange`
- Only rendered when payment method is NOT cash

## Payment Form Changes

### `src/pages/vendor/VendorSeats.tsx`
- Add `paymentProofUrl` state
- After the Transaction ID field (line ~1515), conditionally show `PaymentProofUpload` when `paymentMethod !== 'cash'`
- Check property's `payment_proof_required` to set `required` prop
- Pass `paymentProofUrl` into the booking/receipt insert calls

### Due collection forms (same file, ~line 1653)
- Add proof upload after the due collection payment method selection, when method is not cash

### `src/pages/admin/HostelBedMap.tsx`
- Same pattern: show proof upload for non-cash payments in booking and due collection forms

### `src/components/admin/BookingExtensionDialog.tsx`
- Add proof upload for non-cash extension payments

### `src/pages/admin/ManualBookingManagement.tsx`
- Add proof upload for non-cash manual bookings

### `src/pages/admin/HostelDueManagement.tsx`
- Add proof upload for non-cash due collections

## Display Changes -- Proof Links in Receipts

### `src/pages/AdminBookingDetail.tsx` (Receipts Table)
- Add a "Proof" column header after "Txn ID"
- For each receipt row, if `payment_proof_url` exists, show a clickable camera/image icon that opens the screenshot in a new tab
- If no proof, show "-"

### `src/components/booking/BookingTransactionView.tsx` (Receipt Cards)
- Beside each receipt's `serial_number` (line 220), if `payment_proof_url` exists, add a small clickable "View Proof" link/icon
- Clicking opens the image in a dialog or new tab

## Property Settings

### `src/components/admin/CabinForm.tsx`
- Add "Require Payment Proof for Non-Cash Payments" switch

### `src/components/admin/HostelEditor.tsx`
- Add same switch

## Logic Summary

```text
When payment method is selected:
  - If "cash" -> NO proof upload shown
  - If "upi" or "bank_transfer" -> Show PaymentProofUpload
    - If property.payment_proof_required = true -> field is mandatory
    - If false -> field is optional

In receipt display views:
  - Beside receipt serial number, show camera icon linking to proof image
  - Only visible when payment_proof_url is not empty
```

## Files to Create
| File | Purpose |
|------|---------|
| `src/components/payment/PaymentProofUpload.tsx` | Reusable upload component |

## Files to Modify
| File | Change |
|------|--------|
| Migration SQL | Add columns + storage bucket |
| `src/pages/vendor/VendorSeats.tsx` | Add proof upload for non-cash bookings and due collections |
| `src/pages/admin/HostelBedMap.tsx` | Add proof upload for non-cash hostel payments |
| `src/components/admin/BookingExtensionDialog.tsx` | Add proof upload for non-cash extensions |
| `src/pages/admin/ManualBookingManagement.tsx` | Add proof upload for non-cash manual bookings |
| `src/pages/admin/HostelDueManagement.tsx` | Add proof upload for non-cash due collections |
| `src/pages/AdminBookingDetail.tsx` | Add "Proof" column with clickable link in receipts table |
| `src/components/booking/BookingTransactionView.tsx` | Add proof icon beside receipt serial numbers |
| `src/components/admin/CabinForm.tsx` | Add "Require Payment Proof" toggle |
| `src/components/admin/HostelEditor.tsx` | Add "Require Payment Proof" toggle |
