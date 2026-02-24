

## Fix Booking Confirmation + Add Invoice Download

### Problem Analysis

Three issues are preventing bookings from being created:

1. **Serial number generation fails (main blocker)**: The `generate_serial_number` database function tries to update the `serial_counters` table, but that table blocks all direct access via security policy. The function needs to run with elevated privileges to bypass this restriction.

2. **Booking data query fails**: When loading seat bookings, the system tries to join bookings with student profiles, but the database doesn't have the necessary relationship defined between these tables. This causes a 400 error when fetching booking details.

3. **Invoice feature**: After fixing the above, add an automatic invoice with download option showing all booking details.

---

### Fix 1: Database Migration

A single migration will:
- Make the `generate_serial_number` function run with elevated privileges (SECURITY DEFINER) so it can update serial counters
- Add the missing relationship between bookings and profiles tables (foreign key)

### Fix 2: Update Booking Query

Change the query in `vendorSeatsService.ts` to use the correct join syntax now that the foreign key exists: `profiles!bookings_user_id_fkey(...)` instead of `profiles:user_id(...)`.

### Fix 3: Invoice Generation and Download

After a booking is successfully created:
- Show a success state with full booking details (student name, seat number, cabin, dates, amount breakdown, payment method, transaction ID, serial number)
- Add a "Download Invoice" button that generates a PDF-style invoice in the browser and downloads it
- The invoice will include: company header (InhaleStays), booking serial number, student details, seat/cabin info, date range, price breakdown (seat amount, discount, locker, total), payment method, transaction ID, and collected-by info

---

### Technical Changes

| File | Change |
|------|--------|
| **DB Migration** | `ALTER FUNCTION generate_serial_number SECURITY DEFINER`; `ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id)` |
| **`src/api/vendorSeatsService.ts`** | Fix join syntax from `profiles:user_id(...)` to `profiles!bookings_user_id_fkey(...)` in all booking queries |
| **`src/pages/vendor/VendorSeats.tsx`** | Add post-booking success state with booking details display and "Download Invoice" button; Add invoice generation function using browser-native approach (creates a styled HTML invoice, converts to downloadable PDF via print) |

### Invoice Contents

The downloadable invoice will contain:
- InhaleStays company header
- Invoice number (booking serial number)
- Date of booking
- Student name, email, phone, serial number
- Cabin name and seat number
- Booking period (start date to end date) and duration
- Price breakdown: base price, discount (if any), locker (if any), total
- Payment method and transaction ID (if applicable)
- Collected by name

