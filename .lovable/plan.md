

## Apply Hostel Due Enhancements to Reading Room Due Management

### Changes

**1. Update query to include booking dates** (`src/api/vendorSeatsService.ts`)
- Change the `getAllDues` select to include `start_date` and `end_date` from bookings:
  `bookings:booking_id(serial_number)` becomes `bookings:booking_id(serial_number, start_date, end_date)`

**2. Update Reading Room DueManagement UI** (`src/pages/admin/DueManagement.tsx`)

- Add `Pencil` icon import from lucide-react
- Add date editing state variables (`editingField`, `editDueId`, `editDateValue`, `editMaxDate`, `savingDate`)
- Add "Booking Date" column as first column showing `bookings.start_date`
- Add pencil edit icons next to "Due Date" and "Seat Valid" columns
- Add Date Edit Dialog at bottom (same pattern as hostel version) with:
  - `type="date"` input
  - Validation: seat validity cannot exceed booking end date
  - Save updates `dues` table (`due_date` or `proportional_end_date`)

### Technical Details

**File: `src/api/vendorSeatsService.ts`** (line ~713)
- Expand bookings join: `bookings:booking_id(serial_number, start_date, end_date)`

**File: `src/pages/admin/DueManagement.tsx`**
- Import `Pencil` from lucide-react
- Add 5 state variables for date editing
- Add `Booking Date` TableHead before Student column
- Add TableCell with formatted `start_date`
- Wrap Due Date and Seat Valid cells with pencil button + edit handler
- Add Date Edit Dialog before closing `</div>` (identical pattern to hostel version, but updating `dues` table instead of `hostel_dues`)
