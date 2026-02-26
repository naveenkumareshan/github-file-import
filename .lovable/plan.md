

## Fix: Booking Details Blank Page, Receipt Numbers, Payment History Persistence, Future Booking Dates, and Renewal Logic

### Issue 1: Booking Details Page Always Blank

**Root Cause**: The "Details" button on the All Transactions page navigates to `/admin/bookings/:bookingId/:type` which renders `AdminBookingDetail`. This page calls `adminUsersService.getBookingById()` which returns raw Supabase column names (`start_date`, `end_date`, `payment_status`) but the template expects camelCase properties (`startDate`, `endDate`, `bookingStatus`). It also tries to fetch transactions from the old MongoDB backend (`transactionService.getBookingTransactions(response.data._id)`) which returns nothing.

**Fix**: Rewrite `AdminBookingDetail` to:
- Use `adminBookingsService.getBookingById()` instead (which already maps columns properly)
- Fetch receipts from the `receipts` table instead of the old MongoDB transactions API
- Fetch due info using `vendorSeatsService.getDueForBooking()`
- Show student name, room, seat, dates, pricing, receipts, and due payment history all correctly

### Issue 2: Receipt Number Not Shown in Payment History

**Root Cause**: The `DuePaymentHistory` component and booking cards in `VendorSeats.tsx` don't show the receipt serial number. The `receipts` table has `serial_number` but neither the booking card nor the due payment history queries or displays it.

**Fix**:
- In `DuePaymentHistory`, also fetch matching receipts from the `receipts` table by `due_id` and display the receipt serial number alongside each payment
- In the booking cards in `VendorSeats.tsx`, fetch the booking's receipt and show `serial_number` next to payment info
- In `BookingTransactionView.tsx` (student side), fetch receipts for the booking and show serial numbers

### Issue 3: Payment History Disappears When Dues Are Cleared

**Root Cause**: In `VendorSeats.tsx` line 1445, the DuePaymentHistory component is wrapped inside a condition: `b.paymentStatus === 'advance_paid' && due && dueRemaining > 0`. When dues are fully paid (`dueRemaining === 0`), this entire block including payment history is hidden.

**Fix**: Split the condition so the Due Collection button only shows when `dueRemaining > 0`, but `DuePaymentHistory` always shows when a `due` record exists (regardless of remaining amount).

### Issue 4: Future Booking Should Start After Last Booking's Expiry

**Root Cause**: The "Book Future" button sets the start date to `currentBooking.endDate + 1`, but doesn't check if there are already future bookings. If a future booking already exists, a new future booking should start after that future booking's end date.

**Fix**: When "Book Future" is clicked, check both `currentBookings` and `futureBookings` arrays. Find the latest `endDate` among all existing bookings for this seat, and set the start date to that date + 1.

### Issue 5: Renew Acts as Auto-Renew Without Payment

**Root Cause**: The "Renew" button currently just opens the booking form with pre-filled student and start date. It sets `showFutureBooking = true` which shows the same booking form that requires payment. The issue is the renew button merely pre-fills the form -- it does NOT auto-create a booking. However, looking at the flow, the booking form still requires the partner to select a payment method and click "Confirm". 

If "auto-renew" is happening, it may be because the "Renew" button only shows a toast warning but still proceeds to open the booking form even when the booking is still active. The user might be confused because the form opens immediately.

**Fix**: 
- Block the Renew button from opening the booking form if the current booking hasn't expired yet (today < endDate). Show an alert dialog instead of just a toast.
- Ensure the renewal flow uses the same `createPartnerBooking` with full payment, generating a new booking with a new receipt serial number
- The start date for renewal must be `endDate + 1` of the latest booking (considering future bookings too)

---

### Technical Changes

**File: `src/pages/AdminBookingDetail.tsx`**
- Replace `adminUsersService.getBookingById()` with `adminBookingsService.getBookingById()`
- Map data fields: use the properly mapped response that has `bookingId`, `startDate`, `endDate`, etc.
- Remove the old MongoDB transaction fetching; instead query `receipts` table by `booking_id`
- Add `DuePaymentHistory` component for due info
- Handle the case where `booking.cabinId` or `booking.seatId` are objects vs raw IDs

**File: `src/pages/vendor/VendorSeats.tsx`**
- Line ~1445: Move `DuePaymentHistory` outside the `dueRemaining > 0` condition so it always shows when a due exists
- Line ~1442: After booking serial number, also show receipt serial number by fetching from `receipts` table
- "Renew" button (~line 898): Block form opening if booking hasn't expired; only allow if `today >= endDate`
- "Book Future" button (~line 929): Calculate start date from the latest booking end date (check both current + future bookings)

**File: `src/components/booking/DuePaymentHistory.tsx`**
- Also fetch receipt serial numbers from the `receipts` table by `due_id` and display them alongside each payment entry

**File: `src/components/booking/BookingTransactionView.tsx`**
- Fetch receipts from the `receipts` table by `booking_id` and display receipt serial numbers in the payment history

