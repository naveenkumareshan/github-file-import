

## Fix: Confirm Button Amount Should Match "Collecting Now"

The Confirm button currently shows `advanceAmount + securityDeposit` (e.g., 5000 + 4000 = 9000), but since the new logic treats the partial amount as a portion of the Grand Total (which already includes the security deposit), the button should just show the `advanceAmount` (Collecting Now value).

### Change in `src/pages/admin/HostelBedMap.tsx` (line 1436)

Update the Confirm button text logic:

**Before:**
```typescript
const collectAmt = isAdvanceBooking && advanceComputed ? advanceComputed.advanceAmount : computedTotal;
const secDep = collectSecurityDeposit ? (parseFloat(securityDepositAmount) || 0) : 0;
return collectAmt + secDep;
```

**After:**
```typescript
return isAdvanceBooking && advanceComputed ? advanceComputed.advanceAmount : (computedTotal + (collectSecurityDeposit ? (parseFloat(securityDepositAmount) || 0) : 0));
```

When partial payment is active, the button shows only `advanceAmount` (the "Collecting Now" value). When full payment (no partial), it shows `computedTotal + securityDeposit` as the full grand total.

