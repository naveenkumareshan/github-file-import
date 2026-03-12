

# Add QR/Bank Details Image to Payment Modes

## Problem
Partners creating bank or UPI payment modes have no way to attach a QR code or bank details image. During booking collection, employees need a quick "View" button to show the QR to customers before capturing payment proof.

## Changes

### 1. Database Migration
Add `details_image_url text` column to `partner_payment_modes` table.

### 2. PaymentModesManager — Optional Image Upload
- In the "Add New" form for `bank_transfer` and `upi` tabs, add an optional upload button (Gallery + Capture pattern) below the label field
- Store URL in `details_image_url`
- In the mode list for bank/UPI entries, show a small eye icon button if an image exists — clicking opens a dialog with the full image
- Allow uploading/replacing image on existing entries via same icon button area

### 3. PaymentMethodSelector — "View" Button During Collection
- Fetch `details_image_url` alongside existing fields
- For bank/UPI modes that have an image, show a small `Eye` icon button next to the radio label
- Clicking opens a dialog showing the image full-size so employee can show it to customer
- Not mandatory — button only appears when image exists
- Payment proof capture flow remains unchanged

### 4. Storage
Use existing `payment-proofs` bucket (already public) with `qr/` prefix path.

## Files Modified
- **Migration**: Add `details_image_url` column to `partner_payment_modes`
- `src/components/vendor/PaymentModesManager.tsx` — optional upload in add form + view/replace in list
- `src/components/vendor/PaymentMethodSelector.tsx` — fetch image URL, show View button + dialog

