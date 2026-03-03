
# Update Booking Views, Invoices, Daily/Weekly Pricing Display, and Hostel Offline Booking

## 3 Issues to Address

---

### 1. Update "Applies To" Coupon Info in View Details, Invoices, and All Sides

The new `applies_to` coupon field must be reflected in booking detail pages and invoices so that the discount breakdown (fees vs locker vs both) is clear.

**Files to modify:**

- **`src/pages/AdminBookingDetail.tsx`** (lines 255-260): Update `seatPrice` calculation. Currently:
  - Cabin: `seatPrice = totalPrice + discountAmount - lockerPrice` (already fixed)
  - Add a label showing what the discount applied to, if available from booking data. Since the booking record doesn't store `applies_to`, and the coupon info isn't joined, we'll add a note in the discount label (e.g., "Discount (on fees)" if discount > 0 and locker > 0).
  - Invoice (`handleDownloadInvoice`): The `InvoiceData` already passes `seatAmount` and `discountAmount` separately. For cabin bookings (line 212), `seatAmount` should use the pre-discount seat fee: `seatAmount: (booking.totalPrice || 0) + (booking.discountAmount || 0) - (booking.lockerPrice || 0)`. Verify this is correct.

- **`src/utils/invoiceGenerator.ts`**: The invoice HTML already shows "Seat Booking" with amount and "Discount" separately. Add `durationCount` and `bookingDuration` fields to `InvoiceData` to display duration-based pricing info (e.g., "Seat Booking (2 months)"). Update interface and HTML template.

- **`src/pages/students/StudentBookingView.tsx`** (line 303): Fix `seatPrice` calculation. Currently `seatPrice = booking.seats?.price ?? (booking.total_price - locker_price)`. This doesn't account for discount. Change to: `seatPrice = (booking.total_price || 0) + (booking.discount_amount || 0) - (booking.locker_price || 0)` to show the pre-discount seat fee, and display discount as a separate line (which it already does on line 407-409).

- **`src/pages/BookingDetail.tsx`** (line 191): Show seat price, locker, and discount separately instead of just "Total Amount". Add price breakdown similar to StudentBookingView.

- **`src/pages/StudentDashboard.tsx`**: Already fixed in previous iteration, verify it's correct.

---

### 2. Show Daily/Weekly Seat Price Calculations in View Details and Invoices

**Problem**: When a booking is daily (e.g., 2 days) or weekly, the view details pages and invoices don't show how the price was calculated. They should show "Seat Price (2 days)" or "Seat Price (3 weeks)" so the per-unit rate is clear.

**Files to modify:**

- **`src/utils/invoiceGenerator.ts`**:
  - Add `durationCount?: number` and `bookingDuration?: string` to `InvoiceData` interface
  - Update the "Seat Booking" label to show duration: e.g., `Seat Booking (2 day(s))` or `Room Rent (3 month(s))`

- **`src/pages/AdminBookingDetail.tsx`** (line 390): Change the "Seat Price" label to include duration info. If booking has `booking_duration` and `duration_count`, show "Seat Price (2 days)" instead of just "Seat Price". Same for hostel "Room Rent".
  - Also update `handleDownloadInvoice` to pass `durationCount` and `bookingDuration` to `InvoiceData`.

- **`src/pages/students/StudentBookingView.tsx`** (line 405): Update "Seat Price" label to show duration: `Seat Price (${durationLabel})`

- **`src/pages/BookingDetail.tsx`**: Add duration info to the payment details section.

---

### 3. Hostel Offline Booking: Same Flow as Reading Room (Search + Create New Student)

**Problem**: The hostel offline/manual booking currently requires finding users by email or phone via a dropdown (`ManualBookingManagement.tsx` user selection). The user wants:
1. A search box (name/phone/email) with live results -- same as VendorSeats reading room flow
2. A "Create New Student" collapsible that lets the partner enter name, email, phone and instantly creates a student account, then links the booking to that account

**Files to modify:**

- **`src/pages/admin/ManualBookingManagement.tsx`** (lines 468-500): Replace the current `<Select>` user picker with:
  1. A text `<Input>` for search (name, phone, email) with debounced search using `vendorSeatsService.searchStudents()`
  2. A dropdown results list showing matching students
  3. A "Create New Student" collapsible section with name, email, phone fields
  4. When creating a new student, call the `create-student` edge function (same as `VendorSeats.handleCreateStudent`)
  5. After creation, auto-select the new student and proceed to cabin/hostel selection

  This replaces the existing `renderUserSelection()` function. The search will use the same `vendorSeatsService.searchStudents()` API that already works in VendorSeats.

- The `handleCreateStudent` logic from `VendorSeats.tsx` (around lines 460-510) will be replicated: invoke `supabase.functions.invoke('create-student', ...)` with name, email, phone, then auto-select the returned profile.

---

## Summary of All File Changes

| File | Changes |
|------|---------|
| `src/utils/invoiceGenerator.ts` | Add `durationCount`/`bookingDuration` to interface, show in "Seat Booking (X day/week/month(s))" label |
| `src/pages/AdminBookingDetail.tsx` | Add duration label to Seat Price/Room Rent, pass duration to invoice, verify seatPrice calc |
| `src/pages/students/StudentBookingView.tsx` | Fix seatPrice to pre-discount value, add duration to "Seat Price" label |
| `src/pages/BookingDetail.tsx` | Add price breakdown (seat, locker, discount) and duration info |
| `src/pages/admin/ManualBookingManagement.tsx` | Replace Select user picker with search input + create new student (same pattern as VendorSeats) |
