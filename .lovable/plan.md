

## Enable Partial Payment Collection for All Bookings

### Problem
The "Partial Payment" toggle in the booking form is currently gated behind `selectedCabinInfo?.advanceBookingEnabled` (line 1019 in VendorSeats.tsx). The computed values also check this flag (line 284). This means partners/admins can only use partial payments if the specific Reading Room has "Advance Booking" explicitly enabled in its settings.

### Changes

**File: `src/pages/vendor/VendorSeats.tsx`**

1. **Remove the `advanceBookingEnabled` gate on the toggle** (line 1019): Change `{selectedCabinInfo?.advanceBookingEnabled && (` to always show the partial payment checkbox when a cabin is selected.

2. **Remove the `advanceBookingEnabled` gate on computed values** (line 284): Change `if (!isAdvanceBooking || !selectedCabinInfo?.advanceBookingEnabled) return null;` to `if (!isAdvanceBooking) return null;` so the advance breakdown computes for any booking.

3. **Add manual amount input**: When partial payment is toggled ON, show an editable "Amount to Collect" field (defaulting to cabin's advance % if configured, otherwise 50% of total). The partner can type any custom amount.

4. **Add manual due date input**: Show a date input for "Due Date" (seat valid until this date). Default to start date + cabin's validity days if configured, otherwise start date + 3 days. The partner can pick any custom due date.

5. **Update `advanceComputed` memo**: Use the manual amount and manual due date instead of only auto-calculating. The proportional end date becomes the manual due date directly.

6. **Pass `dueDate` in booking data**: Add `dueDate` to the `handleCreateBooking` call so the service uses the partner-entered due date.

7. **Rename label**: Change "Advance Booking (Partial Payment)" to "Partial Payment (Collect Less)"

**File: `src/api/vendorSeatsService.ts`**

1. **Add `dueDate` to `PartnerBookingData`** (line 93): Add `dueDate?: string` field.

2. **Use manual `dueDate` in `createPartnerBooking`** (line 436): When `data.dueDate` is provided, use it directly as both the `due_date` and `proportional_end_date` in the dues entry, instead of auto-calculating from cabin's validity days and proportional ratio.

### New State Variables in VendorSeats.tsx
- `manualAdvanceAmount` (string) -- editable amount to collect
- `manualDueDate` (Date) -- editable due date / seat validity date

### Flow After Changes
1. Partner clicks any available seat
2. Fills student details and plan (e.g., 30 days, Rs 3000)
3. Sees "Partial Payment" checkbox (always visible)
4. Toggles it ON
5. Enters custom amount to collect: Rs 1000
6. Sets due date: 10 Mar 2026 (seat valid until this date)
7. Summary shows: Total Rs 3000, Collecting Rs 1000, Due Rs 2000, Seat valid until 10 Mar
8. Confirms booking -- due entry created with proportional_end_date = 10 Mar
9. After 10 Mar, seat auto-releases (already implemented in previous change)

No database changes needed.

