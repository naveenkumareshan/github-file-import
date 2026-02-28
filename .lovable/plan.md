

## Fix: Price Sync and Due Balance Calculation

### Problem 1: Price changes not reflecting everywhere
When a price is edited (via the edit button) in both **Seat Map** (VendorSeats) and **Bed Map** (HostelBedMap), the `fetchSeats()`/`fetchBeds()` call updates the main list, but `selectedSeat`/`selectedBed` state remains stale. This means:
- The sheet header still shows the old price
- The booking form uses the old price for calculations
- The grid/table updates but the open side panel does not

### Problem 2: Hostel partial payment Due Balance miscalculated
When collecting a partial payment with security deposit enabled, the security deposit is **double-counted**:
- `grandTotal = bedTotal + securityDeposit` (e.g., 8500 + 5000 = 13500)
- `remainingDue = grandTotal - advanceAmount` (e.g., 13500 - 2000 = 11500)
- But the receipt also records `advanceAmount + securityDeposit` (2000 + 5000 = 7000)
- So the system records 7000 collected + 11500 due = 18500, but actual grand total is only 13500

The security deposit should not be part of "due balance" since it's always collected upfront in the receipt.

---

### Changes

**1. VendorSeats.tsx -- Sync selectedSeat after price update**
- After `handleSavePrice` calls `fetchSeats()`, add a `useEffect` that syncs `selectedSeat` with the refreshed `seats` array whenever `seats` changes
- This ensures the sheet header, booking price, and all calculations reflect the updated price

**2. HostelBedMap.tsx -- Sync selectedBed after price update**
- Same pattern: add a `useEffect` that syncs `selectedBed` with the refreshed `beds` array
- Also update `bookingPrice` when `selectedBed.price` changes

**3. HostelBedMap.tsx -- Fix Due Balance calculation**
- In `advanceComputed`: Calculate `remainingDue` as `computedTotal - advanceAmount` (bed total only, excluding security deposit)
- Security deposit is always collected upfront in the receipt, so it should not inflate the "Due Balance"
- Update the "Amount to Collect" input max to clamp against `computedTotal` (already done, keep consistent)
- Update the confirm step display: "Collecting Now" = advanceAmount + securityDeposit, "Due Balance" = bedTotal - advanceAmount
- Fix `handleCreateBooking`: `remaining = total - advanceAmt` (not `grandTotal - advanceAmt`)
- Fix hostel_dues insert: `total_fee = grandTotal` stays, but `due_amount = total - advanceAmt`

### Technical Detail

```text
Example with the screenshot values:
  Bed Amount:       9000
  Discount:         -500
  Total (bed):      8500
  Security Deposit: 5000
  Grand Total:      13500
  Amount to Collect: 2000

BEFORE (wrong):
  Collecting Now:   2000
  Due Balance:      11500  (grandTotal - advanceAmt = 13500 - 2000)
  Receipt amount:   7000   (2000 + 5000 secDep)
  Total tracked:    18500  (7000 + 11500) -- WRONG, exceeds 13500

AFTER (correct):
  Collecting Now:   7000   (2000 bed payment + 5000 secDep)
  Due Balance:      6500   (bedTotal - advanceAmt = 8500 - 2000)
  Receipt amount:   7000   (2000 + 5000 secDep)
  Total tracked:    13500  (7000 + 6500) -- CORRECT
```

