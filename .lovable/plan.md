

## Add Payment Summary Card to Admin Booking Detail

The current page only shows "Total Price" and "Total Paid (Receipts)" as two fields inside the Booking Information card, plus the raw receipts table. The user wants a dedicated **Payment Summary** card (between Booking Information and Payment Receipts) that shows the full financial picture at a glance.

### Changes to `src/pages/AdminBookingDetail.tsx`

**1. Fetch dues data alongside booking and receipts**
- Query the `dues` table by `booking_id` to get `total_fee`, `advance_paid`, `paid_amount`, `due_amount`, and `status`

**2. Add a "Payment Summary" card between Booking Information and Payment Receipts**

Layout:
```text
+--------------------------------------------------+
| Payment Summary                                   |
|                                                   |
| Total Price     Advance Paid    Total Collected   |
| Rs.2,300        Rs.500          Rs.1,800          |
|                                                   |
| Due Remaining   Status                            |
| Rs.0            [Fully Paid] (green)              |
|                                                   |
| Payment Method: UPI  |  Txn ID: hi hdhdh         |
| Collected By: Admin User                          |
+--------------------------------------------------+
```

- **Total Price**: from `booking.totalPrice`
- **Advance Paid**: from `dues.advance_paid` (initial payment at booking time)
- **Total Collected**: sum of all receipts (existing `totalPaid`)
- **Due Remaining**: `totalPrice - advance_paid - totalPaid` (or from `dues.due_amount - dues.paid_amount`)
- **Status**: Green "Fully Paid" badge if dues status is `paid`, Amber "Partial Paid" if not
- **Payment Method / Txn ID / Collected By**: from the booking record (initial payment info)

**3. Remove the duplicate Total Price / Total Paid fields from Booking Information card**
- The last grid row in Booking Information (lines 206-215) showing Total Price and Total Paid will be removed since the new card covers this

### Technical Details

| File | Change |
|------|--------|
| `src/pages/AdminBookingDetail.tsx` | Add `dueData` state, fetch from `dues` table. Add Payment Summary card with total/advance/collected/remaining/status. Remove price fields from Booking Information card. |

