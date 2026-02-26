

## Renew Flow UX Fixes + Booking Card Enhancements

### 1. Renew: Show "Booked till {endDate}" instead of today's date

**Problem**: When Renew is clicked, the booking form header shows "Booked for 26 Feb 2026" (today). It should say "Booked till 27 Apr 2026" (the current booking's end date) so the partner understands the seat is occupied until that date.

**Change in `src/pages/vendor/VendorSeats.tsx`**:
- Add a state variable `isRenewMode` (boolean) that is set to `true` when Renew is clicked, `false` when Book Future is clicked
- When `isRenewMode && showFutureBooking`, show a header: "Booked till {endDate} -- Renewal starts from {startDate}" above the booking form
- This makes it clear the seat is occupied and the new booking will start after expiry

### 2. Renew: Lock student selection (no search/change)

**Problem**: In renew mode, the student is pre-selected but the search field is editable and the student can be changed or removed. Since renewal is for the same student, the student should be locked.

**Change in `src/pages/vendor/VendorSeats.tsx`**:
- When `isRenewMode` is true, hide the student search input and the "Create New Student" collapsible
- Instead, show a read-only card with the student's name and phone (no X/remove button)
- The `selectedStudent` state is still set (for the booking API) but the UI is non-editable

### 3. Current Booking Card: Paid/Due status buttons + Receipt button

**Problem**: Current booking shows raw `completed` or `advance_paid` text as a badge. Need richer display.

**Change in `src/pages/vendor/VendorSeats.tsx` (current bookings section, lines ~1432-1528)**:
- Replace the `<Badge>` for payment status with:
  - If `completed`: Green "Fully Paid" badge + show total amount paid
  - If `advance_paid`: Amber "Partial Paid" badge + show paid amount and due amount
- Add a "Due: X" indicator (shows 0 if fully paid, actual amount if partial)
- Add a "Receipts" button that fetches from the `receipts` table by `booking_id` and shows them in a dialog (serial number, amount, type, date)
- Show Booking ID (`serialNumber`) prominently
- Always show phone number (already shown but ensure it's visible)

### 4. Future Booking Card: Paid/Due amounts + Receipt button + Booking ID

**Problem**: Future booking card only shows total price and status badge. Missing: paid amount, due amount, receipt button, and booking ID.

**Change in `src/pages/vendor/VendorSeats.tsx` (future bookings section, lines ~1543-1562)**:
- Fetch `bookingDues` for future bookings too (currently only done for current bookings)
- Show paid amount vs due amount
- Replace raw status badge with colored "Partial Paid" / "Fully Paid" badge
- Add "Receipts" button (same dialog as current bookings)
- Show `serialNumber` (Booking ID)
- Ensure phone number is always displayed

### Technical Details

| File | Change |
|------|--------|
| `src/pages/vendor/VendorSeats.tsx` | Add `isRenewMode` state. Update Renew button to set it true, Book Future to set it false. In booking form: show "Booked till X" header when renew mode. Lock student selection in renew mode. In current booking cards: replace Badge with colored Paid/Due buttons, add receipt dialog. In future booking cards: add due info, receipt button, booking ID. Add receipt fetching + dialog state. |

### UI Layout for Current Booking Card (after changes):

```text
+--------------------------------------+
| Naveen bhukya         [Fully Paid]   |
| 26/02 -> 26/03 . 1 monthly          |
| Rs.2300 (incl. locker Rs.300) 833... |
| Paid: Rs.2300  Due: Rs.0            |
| Payment: UPI  Txn: hi hdhdh         |
| Collected by: Admin User            |
| #IS-BOOK-2026-00002                 |
| [Due History]  [Receipts]           |
+--------------------------------------+
```

### UI Layout for Future Booking Card (after changes):

```text
+--------------------------------------+
| Naveen bhukya        [Partial Paid]  |
| 27/03 -> 27/04                       |
| Rs.2300 (incl. locker Rs.300) 833... |
| Paid: Rs.1500  Due: Rs.800          |
| #IS-BOOK-2026-00003                 |
| [Due: Rs.800]  [Receipts]           |
+--------------------------------------+
```

