

# Remove Bank Details from Partner Profile and Registration

## Problem
Bank account management is now handled via the dedicated **Bank Management** page (`/banks`) using `partner_payment_modes`. Having bank fields in both the Partner Profile and Partner Registration creates duplication and confusion.

## Changes

### 1. `src/components/vendor/VendorProfile.tsx`
- Remove the "Bank Details" tab (`<TabsTrigger value="bank">`) from the tabs list
- Remove the entire `<TabsContent value="bank">` block (lines 440-484)
- Remove `bankDetails` from `formData` state initialization and the `handleUpdate` save logic
- Remove the `CreditCard` icon import if no longer used

### 2. `src/pages/vendor/VendorRegister.tsx`
- Remove the bank details step (Step 5) from the multi-step registration form
- Remove bank details validation (case 4 in validation)
- Remove bank detail fields and related form inputs
- Adjust step count/numbering so the flow goes directly from Business Details to the final step
- Remove `bankDetails` from the registration submission payload

Both files will have their bank-related code cleanly removed while keeping all other functionality intact. Partners will manage bank accounts exclusively through the Bank Management page after registration.

