

## Locker Control, Remove Hot Selling, and Fix Seat Map Booking Details

### 1. Locker Mandatory/Optional Control

**Current State**: The `cabins` table has `locker_available` and `locker_price` but no field to indicate whether the locker is mandatory or optional. Students always pay locker deposit as "Key Deposit."

**Changes**:

**Database Migration**: Add `locker_mandatory` boolean column to `cabins` table (default `true` -- backward compatible).

```text
ALTER TABLE cabins ADD COLUMN locker_mandatory boolean NOT NULL DEFAULT true;
```

**File: `src/components/admin/CabinEditor.tsx`**
- Add a radio group or select inside the Locker section: "Locker is Mandatory" / "Locker is Optional for Student"
- Only visible when `lockerAvailable` is toggled on
- Save/load the `locker_mandatory` field from the database

**File: `src/api/adminCabinsService.ts`**
- Include `locker_mandatory` in create/update payloads

**File: `src/components/seats/SeatBookingForm.tsx`**
- Read `cabin.lockerMandatory` (passed from BookSeat)
- If locker is mandatory: show locker deposit as before (no toggle for student)
- If locker is optional: show a checkbox "Add Locker (Rs X)" that the student can check/uncheck
- When unchecked, set `keyDeposit` to 0 and recalculate total
- Update the summary text: "Locker Deposit" instead of "Key Deposit"

**File: `src/pages/BookSeat.tsx`**
- Pass `lockerMandatory` from cabin data to `SeatBookingForm`

### 2. Completely Remove Hot Selling from Everywhere

Hot Selling references exist in 11 files. All must be cleaned:

| File | What to remove |
|------|----------------|
| `src/pages/vendor/VendorSeats.tsx` | Remove `handleToggleHotSelling` function, "Mark Hot" / "Remove Hot" buttons in both card and table views (lines 144-159, 325-329, 395-399) |
| `src/api/vendorSeatsService.ts` | Remove `toggleHotSelling` method, remove `isHotSelling` from interface and mapping |
| `src/components/seats/SeatBookingForm.tsx` | Remove `hotSellingPrice` state, remove 5% markup calculation (lines 236-241), remove "Hot Selling Premium" display (lines 609-614) |
| `src/components/SeatMap.tsx` | Remove hot selling color, legend item, tooltip text |
| `src/components/seats/SeatGridMap.tsx` | Remove `isHotSelling` from Seat interface |
| `src/components/booking/SeatSelectionMap.tsx` | Remove hot selling status mapping and display |
| `src/components/EditSeatView.tsx` | Remove hot selling text (lines 43-47) |
| `src/pages/BookSeat.tsx` | Remove `isHotSelling` from Seat interface |
| `src/components/seats/FloorPlanDesigner.tsx` | Remove `isHotSelling` from interface |
| `src/components/seats/SeatMapEditor.tsx` | Remove `isHotSelling` from interface |
| `src/pages/admin/ManualBookingManagement.tsx` | Remove `isHotSelling` from Seat interface |
| `src/pages/SeatManagement.tsx` | Remove `isHotSelling: false` from seat creation |

### 3. Fix Seat Map Booking Details Capture and Display

**Problem A: `seat_id` not saved in bookings**

Currently `bookingsService.createBooking` only stores `seat_number` but not `seat_id`. The vendor seat map queries bookings by `seat_id` so it finds nothing.

**File: `src/api/bookingsService.ts`**
- Add `seat_id` to `BookingData` interface
- Pass it through in `createBooking`

**File: `src/components/seats/SeatBookingForm.tsx`**
- Pass `seat_id: selectedSeat._id || selectedSeat.id` in the booking creation payload

**Problem B: Seat map not showing full booking details**

**File: `src/api/vendorSeatsService.ts`**
- Expand booking query to fetch ALL bookings for each seat (current + future), not just today's
- Include `booking_duration`, `duration_count`, `total_price`, `payment_status`, `serial_number` from bookings
- Include `serial_number`, `course_studying`, `college_studied`, `address`, `city`, `state`, `date_of_birth`, `gender` from profiles
- Return both `currentBooking` and `allBookings` arrays per seat

**File: `src/api/vendorSeatsService.ts` - Update VendorSeat interface**
- Add `allBookings` array field with full booking + student details
- Each booking entry includes: bookingId, serialNumber, startDate, endDate, totalPrice, paymentStatus, bookingDuration, durationCount, studentName, studentEmail, studentPhone, studentSerialNumber, profilePicture, course, college, address, city, state, gender, dob

**File: `src/pages/vendor/VendorSeats.tsx`**
- Add category column to both card and table views
- Add a "View Details" button on each seat that opens a dialog with:
  - Seat info: number, category, price, floor, availability status
  - Current booking section: full student profile (name, phone, email, serial number, course, college, address, photo)
  - All bookings table: listing current and future bookings with from/to dates, duration, amount, payment status, serial number
- In the table view, add a "Category" column header showing `seat.category`

---

### Summary of All Changes

| Area | Files | Action |
|------|-------|--------|
| Locker Control | DB migration | Add `locker_mandatory` column |
| Locker Control | `CabinEditor.tsx` | Add mandatory/optional radio |
| Locker Control | `SeatBookingForm.tsx` | Conditional locker checkbox for students |
| Locker Control | `BookSeat.tsx`, `adminCabinsService.ts` | Pass through new field |
| Remove Hot Selling | 12 files | Strip all hot selling UI, logic, interfaces |
| Fix Bookings | `bookingsService.ts`, `SeatBookingForm.tsx` | Save `seat_id` in bookings |
| Seat Map Details | `vendorSeatsService.ts` | Fetch all bookings with full student details |
| Seat Map Details | `VendorSeats.tsx` | Add category column, "View Details" dialog with complete booking history |

