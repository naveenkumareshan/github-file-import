

# Move Receipt # Column Next to Payment Date

## Change
In `src/pages/admin/Reconciliation.tsx`, reorder the table columns so **Receipt #** appears immediately after **Payment Date** instead of being the second column. This makes it easy for the approver to copy the receipt number while cross-referencing bank statements.

### Current column order:
S.No → **Receipt #** → Source → Student → Property → Amount → Method → Txn ID → Booking ID → Proof → **Payment Date** → ...

### New column order:
S.No → Source → Student → Property → Amount → Method → Txn ID → Booking ID → Proof → **Payment Date** → **Receipt #** → ...

### Files to modify
- **`src/pages/admin/Reconciliation.tsx`** — Move `Receipt #` TableHead and corresponding TableCell from position 2 to right after Payment Date (both in the header row ~line 518 and data row ~line 540). Also update the mobile card layout if Receipt # positioning matters there.

