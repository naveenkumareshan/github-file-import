

## Fix Due Balance Calculation to Include Security Deposit

### Problem
When collecting a security deposit alongside a partial payment, the "Due Balance" only considers the bed total minus advance, ignoring the security deposit. For example:
- Total: 4500, Security Deposit: 5000, Grand Total: 9500
- Advance Paid: 2250
- Current Due Balance: 2250 (4500 - 2250) -- WRONG
- Correct Due Balance: 7250 (9500 - 2250)

### Changes in `src/pages/admin/HostelBedMap.tsx`

**1. `advanceComputed` memo (line ~556)**: Include security deposit in the remaining due calculation:
```
remainingDue = (total + securityDeposit) - advanceAmount
```

**2. Booking creation (line ~613)**: Fix `remaining` to include security deposit:
```
remaining = (total + secDepAmt) - advanceAmt
```

**3. `remaining_amount` in booking insert (line ~626)**: Use the corrected `remaining` value (already does).

**4. `hostel_dues` insert (line ~666-668)**: Update `total_fee` and `due_amount` to include security deposit so the due management page tracks the full outstanding balance.

**5. `lastBookingInfo.remainingDue` (line ~695)**: Already uses `remaining`, so it will be correct once the calculation is fixed.

### Specific Line Changes

| Location | Current | Fixed |
|---|---|---|
| Line 556 (advanceComputed) | `remainingDue = total - advanceAmount` | `remainingDue = total + secDepAmt - advanceAmount` (needs security deposit state access in memo) |
| Line 613 (booking creation) | `remaining = total - advanceAmt` | `remaining = (total + secDepAmt) - advanceAmt` |
| Line 666 (dues total_fee) | `total_fee: total` | `total_fee: total + secDepAmt` |
| Line 668 (dues due_amount) | `due_amount: remaining` | Already uses corrected `remaining` |

Since `advanceComputed` is a `useMemo` that doesn't currently have access to `collectSecurityDeposit` and `securityDepositAmount`, those dependencies will be added to include the security deposit in the due balance shown in the form UI (lines 1333-1334 and 1378-1379).

### Summary
- 4 calculation fixes in `HostelBedMap.tsx`
- Due balance will correctly reflect: Grand Total (bed total + security deposit) minus advance paid
