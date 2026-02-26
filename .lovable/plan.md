

## 1. Dues Not Appearing in Due Management + 2. Renew, Transfer, and Due Collection on Booked Seat

### Issue 1: Advance bookings not showing in Due Management

**Root cause**: The Due Management page (`src/pages/admin/DueManagement.tsx`) fetches dues correctly from the `dues` table. The dues ARE being created (confirmed in the database). The issue is likely an RLS policy problem -- the `dues` table requires `cabins.created_by = auth.uid()` for vendors, but the query joins on `cabin_id`. Need to verify the query works, and also ensure the `getAllDues` method in `vendorSeatsService.ts` doesn't filter them out accidentally.

**Fix**: Verify and debug the `getAllDues` query. The current query looks correct, so the issue may be that newly created dues aren't appearing until page refresh, or the `cabins` filter in the fetch is filtering them out. Will add console logging and ensure the data flow is correct.

### Issue 2: Add Renew, Transfer Seat, and Due Balance buttons on booked seat view

**What changes in the booked seat drawer** (screenshot reference -- the "Current Student" section):

After the "Book Future Dates" and "Block" buttons, add three new action capabilities:

**A) Renew Booking button**: Opens the booking form pre-filled with the same student, start date = current booking end date + 1 day. Essentially the same as "Book Future Dates" but labeled "Renew" for clarity.

**B) Transfer Seat button**: A new button that allows transferring the booking to a different seat. When clicked, shows a mini seat picker or form to select target seat, then moves the booking.

**C) Due Balance indicator on each booking card**: In the "CURRENT BOOKING" section at the bottom of the drawer, if a booking has `payment_status === 'advance_paid'`, show:
- Due balance amount in a light red/pink button
- Clicking it opens a quick collect payment drawer (reusing the same collect logic from DueManagement)

---

### Technical Changes

**File: `src/api/vendorSeatsService.ts`**

1. Add `getDueForBooking(bookingId)` method -- fetches the due record for a specific booking
2. Add `transferBooking(bookingId, newSeatId, newCabinId)` method -- updates the booking's seat_id and cabin_id, and updates the due record if exists
3. Update `SeatBookingDetail` interface to include optional `dueInfo` (dueId, dueAmount, paidAmount, remaining)

**File: `src/pages/vendor/VendorSeats.tsx`**

1. **Booked seat action buttons** (lines ~808-832): Add "Renew" button alongside existing "Book Future Dates". Add "Transfer Seat" button.

2. **Transfer Seat dialog**: New dialog/sheet where partner selects a target seat from the same cabin (or different cabin). On confirm, calls `transferBooking`.

3. **Current Booking cards** (lines ~1287-1313): For each booking with `paymentStatus === 'advance_paid'`:
   - Fetch due info for the booking
   - Show a light red "Due: ₹X" button
   - Clicking opens inline collect payment form (amount input + payment method + confirm)

4. **Due collection inline**: When the red due button is clicked on a booking card, expand an inline collect form similar to DueManagement's collect drawer but embedded in the sheet.

**File: `src/pages/admin/DueManagement.tsx`**

1. Debug/verify the dues fetch is working. Add booking serial number display in the table for traceability.

---

### Detailed UI Changes

**Booked seat drawer -- action buttons area**:
```text
[ Renew Booking  ] [ Transfer Seat ] [ Block ]
```

**Current Booking card -- with due balance**:
```text
Naveen bhukya                    advance_paid
26/02/2026 -> 26/03/2026 . 1 monthly
Rs.2300 (incl. locker Rs.300)    8333933724
Payment: UPI
Collected by: Admin User
Txn ID: hi hdhdh
#IS-booking-2026-00002
[  Due: Rs.1800  ]  <-- light red button, clickable
```

When clicked, expands to show:
```text
Amount to Collect: [____]
Payment Method: Cash / UPI / Bank / Online
Transaction ID: [____]  (if UPI/Bank)
[Collect Payment]
```

**Transfer Seat flow**:
- Click "Transfer Seat" button
- Dialog opens with cabin selector + seat grid/list showing available seats
- Select target seat -> Confirm transfer
- Booking's seat_id updates, old seat becomes available, new seat becomes occupied

