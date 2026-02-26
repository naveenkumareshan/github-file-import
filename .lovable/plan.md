

## Enhance Payment Summary with Full Price Breakdown

### Problem
The Payment Summary card currently only shows Total Price, Advance Paid, Total Collected, Due Remaining, and Status. The user wants a full breakdown including Seat Price, Locker Amount, and Discount Amount.

### Changes

#### 1. Update `src/api/adminBookingsService.ts` - Fetch seat price

**Line 121**: Add `price` to the seat select query:
```
seats:seat_id(number, price)
```

**Line 143**: Include seat price in the returned data:
```
seatPrice: seat ? Number(seat.price) || 0 : 0,
```

#### 2. Rebuild Payment Summary card in `src/pages/AdminBookingDetail.tsx`

Replace the current Payment Summary (lines 218-271) with a new card showing all requested fields:

**Layout:**
```text
+---------------------------------------------------+
| Payment Summary                                    |
|                                                    |
| Seat Price       Locker Amount    Discount Amount  |
| Rs.2,000         Rs.500           Rs.200           |
|                                                    |
| Total Price      Advance Paid     Due Collected    |
| Rs.2,300         Rs.500           Rs.800           |
|                                                    |
| Total Collected  Due Remaining    Status           |
| Rs.1,300         Rs.1,000         [Partial Paid]   |
+---------------------------------------------------+
```

**Calculation logic (single source of truth):**
- `seatPrice` = `booking.seatPrice` (from seat table)
- `lockerAmount` = `booking.lockerPrice` (from bookings table)
- `discountAmount` = `booking.discountAmount` (from bookings table)
- `totalPrice` = `booking.totalPrice` (already calculated in DB as seat + locker - discount)
- `advancePaid` = `dueData?.advance_paid || 0` (from dues table)
- `dueCollected` = sum of receipts where `receipt_type === 'due_collection'`
- `totalCollected` = `advancePaid + dueCollected` (advance + all due collections)
- `dueRemaining` = `Math.max(0, totalPrice - totalCollected)`
- Status: Unpaid / Partial Paid / Fully Paid (same three-state logic)

### Files Changed

| File | Change |
|------|--------|
| `src/api/adminBookingsService.ts` | Add `price` to seat select, return `seatPrice` |
| `src/pages/AdminBookingDetail.tsx` | Rebuild Payment Summary with 9 fields in 3 rows |

