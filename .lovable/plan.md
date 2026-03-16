

## Fix: Reconciliation Approval for Old Records + Split Payment Receipts

### Issue 1: Cannot approve old transactions + payment method shows raw values

**Root cause**: The reconciliation page resolves custom payment labels by looking up `custom_<uuid>` IDs in `partner_payment_modes`. But old records stored as `custom___default_cash__` don't match any real UUID, so they display the raw string. The `DEFAULT_METHOD_LABELS` map also doesn't cover this pattern.

Additionally, the `getMethodLabel` utility already handles this, but the Reconciliation page uses its own inline label resolution that doesn't account for the `__default_cash__` pattern.

**Fix**:
- Update `Reconciliation.tsx` label resolution (line 169) to use the centralized `getMethodLabel` from `paymentMethodLabels.ts` which already handles `__default_cash__` → "Cash"
- Fix old data: normalize existing `custom___default_cash__` values in all receipt tables to canonical `cash` via a data migration

**Files**: `src/pages/admin/Reconciliation.tsx`
**Migration**: UPDATE receipts, hostel_receipts, mess_receipts, laundry_receipts to set `payment_method = 'cash'` WHERE `payment_method LIKE '%__default_cash__%'`

---

### Issue 2: Split payments generate only one receipt instead of multiple

**Root causes found in 2 flows**:

1. **Reading Room new bookings** (`vendorSeatsService.createPartnerBooking`): Only creates ONE receipt for the primary split. Additional splits are ignored (line 768 has a comment acknowledging this gap).

2. **Mess due collection** (`MessDueManagement.tsx`): Creates `mess_due_payments` per split but does NOT create corresponding `mess_receipts`. So these splits don't appear in receipts or reconciliation.

**Fix**:
- **RR bookings**: After the primary receipt insert in `vendorSeatsService.createPartnerBooking`, loop through remaining splits and create additional receipts (matching the pattern already used in Hostel bookings)
- **Mess due collection**: After inserting each `mess_due_payment` split, also insert a corresponding `mess_receipt` (matching the pattern in Hostel due collection)

**Files**:
| File | Change |
|------|--------|
| `src/pages/admin/Reconciliation.tsx` | Use `getMethodLabel` for label resolution to handle `__default_cash__` and other edge cases |
| `src/api/vendorSeatsService.ts` | Add split receipt creation loop after primary receipt in `createPartnerBooking` |
| `src/pages/admin/MessDueManagement.tsx` | Add `mess_receipts` insert for each split in `handleCollect` |
| DB migration | Normalize old `custom___default_cash__` → `cash` across all receipt tables |

