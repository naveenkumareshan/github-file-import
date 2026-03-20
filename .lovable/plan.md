

## Fix: Separate Locker & Security Deposit from Seat/Bed Fees in Business Performance

### Problem
All reading room receipts are stored with `receipt_type: 'booking_payment'` — there is no separate `locker_payment` type. Similarly, all hostel receipts are `booking_payment` — no separate `security_deposit` type. This means:
- **Seat Fees** currently includes locker deposit amounts
- **Bed Fees** currently includes security deposit amounts
- **Locker Amount** and **Security Deposit** show ₹0 because the receipt_types `locker_payment`/`deposit`/`security_deposit` don't exist

### Root Cause
When bookings are created, a single `booking_payment` receipt is generated for the full collected amount. The locker/security breakdown only exists on the booking records (`bookings.locker_price`, `hostel_bookings.security_deposit`).

### Solution
Join receipts with their bookings to proportionally split amounts:
- **RR receipts**: Join `receipts` → `bookings` to get `locker_included`, `locker_price`, `total_price`. For each receipt, calculate:
  - `locker_portion = (locker_price / total_price) * receipt_amount` (if locker_included)
  - `seat_portion = receipt_amount - locker_portion`
- **Hostel receipts**: Join `hostel_receipts` → `hostel_bookings` to get `security_deposit`, `total_price`. For each receipt:
  - `grand_total = total_price + security_deposit`
  - `security_portion = (security_deposit / grand_total) * receipt_amount`
  - `bed_portion = receipt_amount - security_portion`

### Changes

**`src/hooks/usePartnerPerformance.ts`**

1. Update receipt queries (indices 4, 5, 6, 7) to include booking join:
   - RR: `.select('amount, receipt_type, created_at, payment_method, bookings(locker_included, locker_price, total_price)')`
   - Hostel: `.select('amount, receipt_type, created_at, payment_method, hostel_bookings(security_deposit, total_price)')`

2. Replace simple `sumReceipts` calls with new proportional split logic:
   ```
   // For RR booking_payment receipts:
   seatFees = sum of seat portions (receipt_amount - locker portion)
   lockerAmount = sum of locker portions
   
   // For Hostel booking_payment receipts:
   bedFees = sum of bed portions (receipt_amount - security portion)
   securityDeposit = sum of security portions
   ```

3. Apply same logic to prev-period calculations and the 12-month trend data (queries 11, 12).

### Files Modified
- `src/hooks/usePartnerPerformance.ts` — join receipts with bookings, split amounts proportionally

