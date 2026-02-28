

## Hostel Due Management - Enhancements

### 1. Add Booking Date column (before Student name) and sort by latest created first

- Add a new "Booking Date" column as the first column, showing the booking's `start_date`
- Change the query's `.order()` from `due_date ascending` to `created_at descending` so newest dues appear first

### 2. Editable Due Date

- Add a pencil/edit icon next to the Due Date cell
- Clicking it opens a small inline date picker (or a dialog) to change the due date
- On save, update `hostel_dues.due_date` in the database and refresh

### 3. Editable Bed Validity Date (proportional_end_date)

- Add a pencil/edit icon next to the Bed Valid cell
- Clicking it opens a date picker to change the `proportional_end_date`
- Constraint: The selected date cannot exceed the booking's `end_date` (total booking validity)
- On save, update `hostel_dues.proportional_end_date` in the database

### 4. Bed availability impact

- The bed availability logic in `HostelBedMap.tsx` already checks overlapping bookings. The `proportional_end_date` on hostel_dues should be used similarly to how the reading room uses it for seat availability -- beds with advance_paid status should only be considered "occupied" up to their `proportional_end_date`, not the full booking `end_date`
- This requires updating the bed availability check in the hostel bed map to also consider `proportional_end_date` from `hostel_dues` when determining if a bed is available on a given date

### Technical Details

**File: `src/pages/admin/HostelDueManagement.tsx`**

1. Change query order: `.order('created_at', { ascending: false })` instead of `.order('due_date', { ascending: true })`
2. Add new state for editing: `editingDueDate`, `editingBedValid`, `editDueId`, `editDateValue`
3. Add "Booking Date" column header and cell before "Student" column, displaying `hostel_bookings.start_date`
4. Add edit icons next to Due Date and Bed Valid cells
5. Add a small Dialog for date editing with a date input, validation (bed valid date <= booking end_date), and save button
6. Save handler updates the respective field in `hostel_dues` table

**File: `src/pages/admin/HostelBedMap.tsx`** (or equivalent bed availability logic)

- When checking bed availability for date-based filtering, also query `hostel_dues` for the bed and check if `proportional_end_date` is set. If an advance-paid booking's `proportional_end_date` has passed, the bed should be considered available after that date (similar to reading room seat logic)

**File: `src/api/hostelBookingService.ts`**

- Update `getAvailableBeds` to also check `hostel_dues.proportional_end_date` for advance_paid bookings, so beds past their validity date are shown as available

