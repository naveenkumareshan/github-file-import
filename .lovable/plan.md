

## Reset and Rebuild: Payment Summary + Receipts

### Root Cause

The `adminBookingsService.getBookingById()` (line 117-158) maps raw Supabase data into a legacy format but **drops critical fields**:
- `payment_method`, `transaction_id`, `collected_by_name` (initial booking payment info)
- `locker_included`, `locker_price`, `discount_amount`, `discount_reason` (price breakdown)
- `booking_duration`, `duration_count` (context info)

The Payment Summary card tries to read `booking.paymentMethod` / `booking.payment_method` but neither exists in the mapped object, so everything shows as `-`.

### Plan

#### 1. Fix `adminBookingsService.getBookingById` to include all fields

**File:** `src/api/adminBookingsService.ts` (lines 131-152)

Add the missing fields to the returned data object:
- `paymentMethod: data.payment_method`
- `transactionId: data.transaction_id`
- `collectedByName: data.collected_by_name`
- `lockerIncluded: data.locker_included`
- `lockerPrice: Number(data.locker_price) || 0`
- `discountAmount: Number(data.discount_amount) || 0`
- `discountReason: data.discount_reason`
- `bookingDuration: data.booking_duration`
- `durationCount: data.duration_count`

#### 2. Rebuild Payment Summary card with correct logic

**File:** `src/pages/AdminBookingDetail.tsx`

Derive all financial values from backend data with a single calculation source:

```text
totalPrice      = booking.totalPrice (from DB: seat + locker - discount, already calculated)
advancePaid     = dueData?.advance_paid || 0 (from dues table)
totalCollected  = sum of all receipts amounts (from receipts table)
dueRemaining    = totalPrice - totalCollected (single formula, no branching)

Status:
  totalCollected = 0          -> "Unpaid" (red)
  dueRemaining = 0            -> "Fully Paid" (green)
  totalCollected > 0          -> "Partial Paid" (amber)
```

Display layout:
```text
+---------------------------------------------------+
| Payment Summary                                    |
|                                                    |
| Total Price      Advance Paid     Total Collected  |
| Rs.2,300         Rs.500           Rs.1,000         |
|                                                    |
| Due Remaining    Status                            |
| Rs.1,300         [Partial Paid]                    |
|                                                    |
| Payment Method: UPI | Txn ID: xyz | By: Admin     |
+---------------------------------------------------+
```

#### 3. Rebuild Payment Receipts table with correct columns

**File:** `src/pages/AdminBookingDetail.tsx`

Columns: Receipt ID | Type | Amount | Method | Date | Collected By | Notes

Receipt type mapping:
- `booking_payment` -> "Advance" (initial booking payment)  
- `due_collection` -> "Due Collection"
- Everything else -> "Payment"

Add a summary row at the bottom showing **Total Collected** so it auto-updates.

#### 4. Remove old status badge logic

Replace the complex branching `dueData?.status === 'paid'` / `totalPaid >= ...` logic with the clean three-state formula above.

### Files Changed

| File | Change |
|------|--------|
| `src/api/adminBookingsService.ts` | Add missing fields to `getBookingById` return |
| `src/pages/AdminBookingDetail.tsx` | Rebuild Payment Summary with correct formula, rebuild Receipts table with total row, fix status logic |
