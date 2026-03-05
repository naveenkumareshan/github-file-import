

# Fix: Show Partner Payment Methods for Employees Everywhere

## Problem Summary

Three issues:

1. **`PaymentMethodSelector` receives `user?.id` as `partnerId`** — for employees this is their own ID, not the partner's. So custom payment modes don't load.
2. **DueManagement and HostelDueManagement use hardcoded RadioGroup** instead of `PaymentMethodSelector`, so they never show custom payment modes for anyone.
3. **Payment method display in receipts/bookings** — pages like `HostelBedMap` and `DueManagement` show raw `payment_method` values (e.g. `custom_uuid`) instead of resolved labels.
4. **RLS on `partner_payment_modes`** — only allows `auth.uid() = partner_user_id`. Employees can't read their partner's payment modes. Need an employee SELECT policy.

## Changes

### Database Migration
Add employee read policy on `partner_payment_modes`:
```sql
CREATE POLICY "Employees can view employer payment modes"
ON public.partner_payment_modes FOR SELECT
USING (is_partner_or_employee_of(partner_user_id));
```

### Fix `partnerId` prop everywhere (use `user.vendorId || user.id`)

| File | Current | Fix |
|------|---------|-----|
| `src/pages/vendor/VendorSeats.tsx` line 1626 | `partnerId={user?.id}` | `partnerId={user?.vendorId \|\| user?.id}` |
| `src/pages/admin/HostelBedMap.tsx` lines 1438, 1525 | `partnerId={user?.id}` | `partnerId={user?.vendorId \|\| user?.id}` |
| `src/components/vendor/PaymentModesManager.tsx` line 38 | `.eq('partner_user_id', user.id)` | `.eq('partner_user_id', user.vendorId \|\| user.id)` |

### Replace hardcoded RadioGroup with PaymentMethodSelector

| File | Change |
|------|--------|
| `src/pages/admin/DueManagement.tsx` | Replace RadioGroup (lines 371-388) with `<PaymentMethodSelector>`, add `resolvePaymentMethodLabels` for receipt display (line 443) |
| `src/pages/admin/HostelDueManagement.tsx` | Replace RadioGroup (lines 454-471) with `<PaymentMethodSelector>`, add label resolution for receipt display (line 530) |

### Resolve payment method labels in display

| File | Line | Current | Fix |
|------|------|---------|-----|
| `src/pages/admin/HostelBedMap.tsx` line 1659 | Inline ternary | Use `getMethodLabel()` with resolved custom labels |
| `src/pages/admin/DueManagement.tsx` line 443 | Raw `r.payment_method` | Use `getMethodLabel()` |
| `src/pages/admin/HostelDueManagement.tsx` line 530 | Raw `r.payment_method` | Use `getMethodLabel()` |

### Files to Change
- **DB Migration**: Add employee RLS policy on `partner_payment_modes`
- `src/pages/vendor/VendorSeats.tsx` — fix partnerId
- `src/pages/admin/HostelBedMap.tsx` — fix partnerId + resolve labels
- `src/pages/admin/DueManagement.tsx` — replace RadioGroup with PaymentMethodSelector + resolve labels
- `src/pages/admin/HostelDueManagement.tsx` — replace RadioGroup with PaymentMethodSelector + resolve labels
- `src/components/vendor/PaymentModesManager.tsx` — use effective owner ID

