

## Move Payment Details to Receipts Table

### Problem
- Payment Method, Transaction ID, and Collected By are shown in the Payment Summary card but belong in Payment Receipts
- The initial advance/booking payment is not shown as a row in the Payment Receipts table

### Changes to `src/pages/AdminBookingDetail.tsx`

**1. Remove from Payment Summary card (lines 268-283)**
- Delete the last separator and the 3-column grid showing Payment Method, Transaction ID, and Collected By
- Payment Summary will only show: Total Price, Advance Paid, Total Collected, Due Remaining, Status

**2. Add initial booking payment as first row in Payment Receipts table**
- Create a synthetic "Advance" row from the booking data itself:
  - Receipt ID: booking serial number
  - Type: "Advance" badge
  - Amount: `dueData?.advance_paid` or `booking.totalPrice` (if no dues record, full amount was paid)
  - Method: `booking.paymentMethod`
  - Transaction ID: `booking.transactionId` (add new column)
  - Date: `booking.createdAt`
  - Collected By: `booking.collectedByName`
- This row appears at the bottom of the list (oldest first) or we combine it with existing receipts

**3. Add Transaction ID column to receipts table**
- Add a "Txn ID" column between Method and Date columns
- Show `r.transaction_id` for receipt rows, `booking.transactionId` for the advance row

**4. Recalculate Total Collected**
- Total Collected = advance paid (from booking) + sum of all due collection receipts
- This ensures the advance payment is counted in the total

### Layout after changes

Payment Summary card:
```text
Total Price    Advance Paid    Total Collected
Rs.2,300       Rs.500          Rs.1,000

Due Remaining  Status
Rs.1,300       [Partial Paid]
```

Payment Receipts table:
```text
Receipt ID | Type | Amount | Method | Txn ID | Date | Collected By | Notes
-----------+------+--------+--------+--------+------+--------------+------
(booking)  | Advance | 500 | Cash | - | 26 Feb | Admin User | -
RCPT-00001 | Due Collection | 900 | Cash | - | 26 Feb | Admin User | -
RCPT-00002 | Due Collection | 100 | Cash | - | 26 Feb | Admin User | -
                    Total Collected: Rs.1,500
```

### Files
| File | Change |
|------|--------|
| `src/pages/AdminBookingDetail.tsx` | Remove payment details from summary, add advance row + txn ID column to receipts table |

