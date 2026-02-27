

## Add "Total Paid" and "Due Pending" Lines to All Booking Lists

### Overview
Add two new lines -- "Paid" and "Due" -- below the existing price breakdown in both reading room and hostel booking lists. These lines will always be visible (not conditional).

### Changes

#### 1. Reading Room Service (`src/api/adminBookingsService.ts`)
- Update the query (line 27) to join the `dues` table: add `dues:dues!dues_booking_id_fkey(advance_paid, paid_amount, due_amount)` to the select
- Note: `dues` has `booking_id` column referencing the booking, but no explicit FK. We'll use a separate query or embed reference. Since there's no FK defined, we'll fetch dues separately per booking OR use a left-join approach via `dues!booking_id`
- Add to mapped output:
  - `totalPaid`: from dues record (`advance_paid + paid_amount`), fallback to `totalPrice` if payment_status is "completed" and no dues record
  - `duePending`: from dues record (`due_amount - paid_amount`), fallback to 0

#### 2. Reading Room UI (`src/pages/AdminBookings.tsx`, line 167-172)
- After the Seat/Locker lines, add two more lines (always shown):
  - `Paid: ₹{totalPaid}` in green text
  - `Due: ₹{duePending}` in red/amber text

#### 3. Hostel Bookings Query (`src/pages/hotelManager/AdminHostelBookings.tsx`, line 69-72)
- Update the select to also join `hostel_dues(advance_paid, paid_amount, due_amount)` via `booking_id`
- Calculate:
  - `totalPaid = advance_amount + (hostel_dues?.paid_amount || 0)`
  - `duePending = remaining_amount - (hostel_dues?.paid_amount || 0)`

#### 4. Hostel Bookings UI (`src/pages/hotelManager/AdminHostelBookings.tsx`, line 198-203)
- After the Bed/Deposit lines, add two more lines (always shown):
  - `Paid: ₹{totalPaid}` in green text
  - `Due: ₹{duePending}` in red/amber text

### Visual Result (Always Shown)
```text
Reading Room:              Hostel:
Seat: 2,000                Bed: 4,500
Locker: 300                Deposit: 5,000
Paid: 2,300                Paid: 4,500
Due: 0                     Due: 5,000
```

### Technical Notes
- The `dues` table has columns: `advance_paid`, `paid_amount`, `due_amount`, `booking_id`
- The `hostel_dues` table has columns: `advance_paid`, `paid_amount`, `due_amount`, `booking_id`
- Since foreign keys may not be explicitly defined for the join, we may need to use `.select('..., dues(...)').eq('dues.booking_id', ...)` or fetch dues in a separate query and merge client-side
- 3 files modified total

