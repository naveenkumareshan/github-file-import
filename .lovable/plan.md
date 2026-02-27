

## Fix Three Issues: Header Due Info, Advance-Paid Card Actions, and View Details Crash

### Issue 1: Replace "Next Payment" with Due Info
The "Next Payment" card in the header is not useful. Replace it with a "Due Amount" card that shows:
- If the student has any pending/overdue dues: show the total due amount and due date
- Add a "Pay" button that navigates to the booking detail page where they can pay
- If no dues: show "No Dues" with a checkmark

**File: `src/pages/StudentBookings.tsx`**
- Fetch full due info (including `due_date`) instead of just amount
- Replace the "Next Payment" card with a "Due Amount" card
- Update `activeCount` to also count `advance_paid` bookings (line 166)

### Issue 2: Advance-Paid Bookings Missing View Details and Renew Buttons
In `BookingsList.tsx` line 309, the action buttons (View Details, Renew) only render when `paymentStatus === 'completed'`. Bookings with `advance_paid` status are excluded.

**File: `src/components/booking/BookingsList.tsx`**
- Change condition from `booking.paymentStatus === 'completed'` to `['completed', 'advance_paid'].includes(booking.paymentStatus)` (line 309)
- Also update the validity indicator block (line 244) to include `advance_paid`

### Issue 3: View Details Page Crashes
In `src/pages/students/StudentBookingView.tsx` line 373, the code references `cabin?.slots_enabled` but `cabin` is never declared as a variable. It should be `booking.cabins?.slots_enabled`. This causes a runtime error that breaks the entire page.

**File: `src/pages/students/StudentBookingView.tsx`**
- Change `cabin?.slots_enabled` to `booking.cabins?.slots_enabled` on line 373

### Files Modified

| File | Change |
|------|--------|
| `src/pages/StudentBookings.tsx` | Replace "Next Payment" card with Due Amount card; count advance_paid in activeCount |
| `src/components/booking/BookingsList.tsx` | Show View Details and Renew for advance_paid bookings; show validity indicator for advance_paid |
| `src/pages/students/StudentBookingView.tsx` | Fix undefined `cabin` variable to `booking.cabins` |

