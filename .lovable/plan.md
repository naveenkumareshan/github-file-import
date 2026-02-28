

## Fix: Due Balance Should Track Against Grand Total

The current logic treats security deposit as always collected upfront separately. The user wants a simpler model:

**User's expected calculation:**
- Bed Amount: 1000
- Discount: -200
- Bed Total: 800
- Security Deposit: 800
- Grand Total (Total Receivable): 1600
- Amount to Collect (partial): 500
- Collecting Now: 500
- Due Balance: 1100 (1600 - 500)

The partial payment amount covers any portion of the grand total. Due balance = grandTotal - collectingAmount.

### Changes in `src/pages/admin/HostelBedMap.tsx`

**1. Fix `advanceComputed` memo (~line 553-576)**
- Clamp advance amount to `grandTotal` instead of just `total`
- Calculate `remainingDue = grandTotal - advanceAmount`
- Remove the separate `secDepAmt` from the return (no longer needed separately for display)

**2. Fix "Collecting Now" display (~lines 1350, 1395)**
- Show just `advanceComputed.advanceAmount` (the amount entered), NOT `advanceAmount + secDepAmt`
- The partial amount already represents everything being collected

**3. Fix `handleCreateBooking` (~line 627-631)**
- `remaining = grandTotal - advanceAmt` (not `total - advanceAmt`)
- Receipt amount = `advanceAmt` (just what's collected, no separate security deposit addition)

**4. Fix dues insert (~line 684-685)**
- `advance_paid = advanceAmt`
- `due_amount = grandTotal - advanceAmt`

**5. Fix receipt amount (~line 661)**
- `receiptAmount = advanceAmt` (not `advanceAmt + secDepAmt`, since the partial amount already includes whatever portion covers security deposit)

### Summary of logic change

```
BEFORE: Security deposit always collected separately upfront
  Collecting Now = advanceAmount + securityDeposit
  Due Balance = bedTotal - advanceAmount
  Receipt = advanceAmount + securityDeposit

AFTER: Single partial amount against grand total
  Collecting Now = advanceAmount (partial of grandTotal)
  Due Balance = grandTotal - advanceAmount
  Receipt = advanceAmount
```
