

# Remove Payout Settings Button from Partner Settlements

## Change
Remove the Settings (gear icon) button from each settlement row's action column, along with its associated state and dialog. The payout settings functionality will remain accessible only at the partner level.

## File to Modify
**`src/pages/admin/PartnerSettlements.tsx`**

1. Remove the `showSettings` state variable (line 33)
2. Remove the Settings button from the actions column (line 291)
3. Remove the Settings Dialog render block (lines 357-360)
4. Remove the `PartnerPayoutSettingsDialog` import and the `Settings` icon import (if no longer used elsewhere)

This is a straightforward removal -- no logic changes needed elsewhere since payout settings are independently accessible from the partner management pages.

