

## Receipts Menu, Renew/Transfer Validation, and Data Integrity Fixes

### 1. Receipts Page -- Central Receipt Registry with Serial Numbers

**Problem**: Payment receipts (booking payments + due collections) are scattered across different views with no central location and no unique receipt serial numbers.

**Solution**: Create a new "Receipts" page accessible from the admin sidebar that shows ALL payment receipts in one place with unique serial numbers.

**Database Changes**:
- Add a new `receipts` table to store every payment receipt:
  - `id` (uuid, PK)
  - `serial_number` (text) -- auto-generated via `generate_serial_number('RCPT')`
  - `booking_id` (uuid, FK to bookings)
  - `due_id` (uuid, nullable, FK to dues) -- for due payments
  - `user_id` (uuid) -- the student
  - `cabin_id` (uuid)
  - `seat_id` (uuid)
  - `amount` (numeric)
  - `payment_method` (text)
  - `transaction_id` (text)
  - `collected_by` (uuid, nullable)
  - `collected_by_name` (text)
  - `receipt_type` (text) -- 'booking_payment' or 'due_collection'
  - `notes` (text)
  - `created_at` (timestamptz)
- Add serial trigger `set_serial_receipts` for auto serial number
- RLS policies: admins full access, vendors for own cabins, students for own receipts

**Code Changes**:

| File | Change |
|------|--------|
| `src/pages/admin/Receipts.tsx` | New page: table listing all receipts with filters (room, date range, type, search by student name/phone). Shows serial number, student name, room, seat, amount, method, type (booking/due), date, collected by |
| `src/components/admin/AdminSidebar.tsx` | Add "Receipts" menu item under Bookings submenu for admin/vendor/vendor_employee |
| `src/App.tsx` | Add route `/admin/receipts` |
| `src/api/vendorSeatsService.ts` | Add `createReceipt()` method; update `createPartnerBooking()` to insert a receipt; update `collectDuePayment()` to insert a receipt; add `getAllReceipts()` with filters |
| Student side | Add a "My Receipts" link in the student dashboard showing their receipts from the `receipts` table |

Every booking payment and every due collection (including partial) will automatically create a receipt with a unique serial number (e.g., IS-RCPT-2026-00001).

---

### 2. Renew -- Validate Future Date Only After Expiry

**Problem**: The Renew button currently just sets start date to current booking end_date + 1, but doesn't enforce that the new booking must start after the current booking expires. Also no explicit check that the renewal dates don't overlap with existing bookings.

**Fix in `src/pages/vendor/VendorSeats.tsx`**:
- When "Renew" is clicked, check that today >= current booking's end_date (i.e., booking has expired or is expiring today). If not, show a warning dialog: "Current booking is active until {endDate}. Renewal will start from {nextDay}."
- The `createPartnerBooking` API already checks for overlapping bookings (lines 381-393), so duplicate prevention is already handled. But the check only looks at `completed` status -- update to also check `advance_paid` status to prevent overlap with advance bookings.

**Fix in `src/api/vendorSeatsService.ts` (createPartnerBooking)**:
- Change the overlap check from `.eq('payment_status', 'completed')` to `.in('payment_status', ['completed', 'advance_paid'])` to catch all active bookings.

---

### 3. Transfer Seat -- Validate Date Availability

**Problem**: Transfer currently just moves the booking to any "available" seat without checking if the target seat has existing bookings for the same date range.

**Fix in `src/api/vendorSeatsService.ts` (transferBooking)**:
- Before transferring, fetch the booking's start_date and end_date
- Check target seat for any overlapping bookings in that date range
- Return error if overlap found: "Target seat has an existing booking for those dates"
- Only proceed if target seat is truly free for the full booking period

**Fix in `src/pages/vendor/VendorSeats.tsx` (openTransferDialog)**:
- When loading available seats for transfer, also pass the booking's date range and filter out seats that have overlapping bookings for that period (not just seats that are "available" on the selected date)

---

### 4. Prevent Duplicate/Overlapping Bookings Across All Flows

**Problem**: The overlap check in `createPartnerBooking` only checks `completed` status, missing `advance_paid` bookings.

**Fixes**:

| Location | Fix |
|----------|-----|
| `createPartnerBooking` overlap check | Change `.eq('payment_status', 'completed')` to `.in('payment_status', ['completed', 'advance_paid'])` |
| `transferBooking` | Add overlap check before moving |
| Seat status display (`computeDateStatus`) | Already handles both statuses correctly -- no change needed |

---

### 5. Seat Availability Accuracy for Students

**Problem**: Changes by partner/admin (blocks, transfers, due-based releases) must be accurately reflected in the student-facing seat grid.

**Current state**: The `computeDateStatus` function already handles:
- Date-range blocks
- Advance-paid bookings with proportional end dates
- Regular bookings

**Fix**: Ensure the student-side booking flow (`BookSeat.tsx` or the cabin booking page) also checks `advance_paid` bookings when determining seat availability. Check that the student booking flow uses the same overlap validation.

---

### Summary of All Changes

**Database**: 1 new table (`receipts`) + 1 trigger + RLS policies

**New Files**:
- `src/pages/admin/Receipts.tsx` -- Central receipts page

**Modified Files**:
- `src/api/vendorSeatsService.ts` -- Add receipt creation in booking + due collection flows; add `getAllReceipts()`; fix overlap check; add transfer date validation
- `src/pages/vendor/VendorSeats.tsx` -- Renew validation warning; transfer date-range filtering
- `src/components/admin/AdminSidebar.tsx` -- Add "Receipts" menu item
- `src/App.tsx` -- Add receipts route

