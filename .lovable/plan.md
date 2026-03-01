

# Add Payout Settings Button to Partner Management Page

## What Changes

Add a "Payout Settings" (gear/wallet icon) button in the Actions column of each partner row on the Partner Management page (`/admin/vendors`). This lets the admin configure settlement rules (commission, cycle, TDS, etc.) directly from the partner list without needing to navigate to the Settlements page first.

## Technical Details

### File: `src/components/admin/VendorApproval.tsx`

1. **Import** `PartnerPayoutSettingsDialog` and `Settings` icon
2. **Add state**: `showPayoutSettings` (string | null) to track which partner's settings dialog is open
3. **Add a Settings button** in the Actions column (both desktop table and mobile card view) for each partner -- clicking it sets `showPayoutSettings` to `v.id` (the partner's ID from the `partners` table, which is what `PartnerPayoutSettingsDialog` expects)
4. **Render** `PartnerPayoutSettingsDialog` at the bottom of the component when `showPayoutSettings` is set

### No other file changes needed
- `PartnerPayoutSettingsDialog` already exists and accepts `partnerId`, `open`, `onClose` props
- The `partner_payout_settings` table and RLS policies are already in place
- The `settlementService` already handles upsert of payout settings

