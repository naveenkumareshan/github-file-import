

# Feature 1: QR Code Buttons in Operations Hub + Feature 2: Mess QR Attendance for Students + Offline Mess Booking

This is a large combined implementation touching Operations Hub, student scanning, mess management, and a new manual mess booking flow.

---

## Part 1: QR Code Buttons in Operations Hub

**Problem**: Operations Hub has no QR code download buttons. Partners see QR only from Manage Properties. Employees restricted to specific properties should only see QR for those properties.

**Solution**: Add a QR code section at the top of the CheckInTracker component showing downloadable QR buttons per property.

### Changes:
- **`src/components/admin/operations/CheckInTracker.tsx`**:
  - Fetch partner's cabins and hostels (using `getEffectiveOwnerId`)
  - For employees with `allowed_properties`, filter to only those
  - Render a row of QR download buttons (one per property) above the check-in table
  - Use the `qrcode` library (already in deps) to generate and download QR images
  - Group by property type (Reading Room / Hostel / Mess)

- **`src/hooks/usePartnerPropertyTypes.ts`**: No changes needed, already provides property type flags

### Employee property filtering:
- Read `allowed_properties` from `vendor_employees` table for employee users
- If empty array → show all properties (existing convention)
- If populated → filter QR buttons to only those property IDs

---

## Part 2: Mess QR Attendance for Students

**Problem**: Students can scan QR for reading rooms and hostels but not mess. The `mark_qr_attendance` RPC and `ScanAttendance` page only support `reading_room` and `hostel` types.

**Solution**: Extend QR system to support `mess` property type.

### Database Changes:
- **Migration**: Update `mark_qr_attendance` RPC to add a `mess` branch:
  - Validate student has an active `mess_subscription` at this mess
  - Auto-detect current meal type (breakfast/lunch/dinner) based on time
  - Insert into `mess_attendance` table
  - Prevent duplicate meal-type attendance for same date
- Update `validate_property_attendance_type` trigger to allow `'mess'` type

### Code Changes:
- **`src/pages/student/ScanAttendance.tsx`**: Already handles generic QR data `{propertyId, type}` — no changes needed since the RPC will handle `mess` type
- **`src/components/admin/MessItem.tsx`**: Add `onDownloadQr` prop and QR button (same pattern as CabinItem/HostelItem)
- **`src/pages/admin/MessManagement.tsx`**: Pass `onOpenQr` to MessManagement and wire to MessItem
- **`src/pages/partner/ManageProperties.tsx`**: Pass `onOpenQr` to MessManagement (same as rooms/hostels)
- **`src/pages/students/MessDashboard.tsx`**: Remove the subscription-based QR code (which encodes subscription_id) since property QR is the correct pattern

---

## Part 3: Offline/Manual Mess Booking

**Problem**: No way for partners/employees to create mess subscriptions offline. Only online student booking exists.

**Solution**: Create a manual mess subscription booking page following the same pattern as the existing manual reading room booking (student search → select mess → select package → dates → payment → create subscription).

### Database Changes:
- **Migration**: Add columns to `mess_subscriptions`:
  - `advance_amount` (numeric, default 0) — for partial payments
  - `discount_amount` (numeric, default 0)
  - `notes` (text, nullable)
  - `created_by` (uuid, nullable, references profiles) — who created the booking
  - `collected_by_name` (text, nullable)
  - `payment_proof_url` (text, nullable)
- Create `mess_dues` table (same pattern as `dues` / `hostel_dues`):
  - id, subscription_id, user_id, mess_id, due_amount, paid_amount, advance_paid, status, due_date, serial_number, transaction_id, payment_method, payment_proof_url, collected_by, collected_by_name, notes, created_at, updated_at
- Create `mess_due_payments` table (same pattern as `due_payments` / `hostel_due_payments`)
- Add serial triggers for mess_dues

### New Files:
- **`src/pages/admin/ManualMessBooking.tsx`**: Manual mess subscription creation page
  - Step 1: Search/create student (reuse debounced search pattern from ManualBookingManagement)
  - Step 2: Select mess partner (dropdown of partner's mess places)
  - Step 3: Select package (from mess_packages)
  - Step 4: Choose start date → auto-calculate end date based on package duration
  - Step 5: Payment details (payment method selector, amount, discount, advance/partial, transaction ID, proof upload, notes)
  - Step 6: Review & Create subscription
  - Actions: Create `mess_subscription` + create `mess_dues` if partial payment + create `mess_receipt`

### Subscription Management (in MessBookings.tsx):
- Add action buttons per subscription row:
  - **Cancel**: Set status to `cancelled`
  - **Renew**: Open renewal flow (extend end_date, create new receipt)
  - **Collect Due**: If partial payment, collect remaining amount

### Sidebar & Routing:
- **`src/components/admin/AdminSidebar.tsx`**: Add "Manual Booking" item under Mess / Food section
- **`src/App.tsx`**: Add route for `/admin/mess-manual-booking`

---

## Files Summary

### Database Migrations:
1. Update `mark_qr_attendance` RPC to support mess
2. Update `validate_property_attendance_type` to allow mess
3. Add columns to `mess_subscriptions` (advance_amount, discount_amount, notes, created_by, collected_by_name, payment_proof_url)
4. Create `mess_dues` and `mess_due_payments` tables with serial triggers

### New Files:
- `src/pages/admin/ManualMessBooking.tsx` — full manual booking flow

### Modified Files:
- `src/components/admin/operations/CheckInTracker.tsx` — QR buttons at top
- `src/components/admin/MessItem.tsx` — add QR button
- `src/pages/admin/MessManagement.tsx` — wire QR handler
- `src/pages/partner/ManageProperties.tsx` — pass onOpenQr to MessManagement
- `src/pages/admin/MessBookings.tsx` — add Cancel/Renew/Collect actions
- `src/components/admin/AdminSidebar.tsx` — add manual booking link
- `src/App.tsx` — add route
- `src/pages/students/MessDashboard.tsx` — remove subscription-based QR, direct to property QR scan

