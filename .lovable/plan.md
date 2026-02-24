

## Advance Booking & Due Management Module

A comprehensive finance module for partial payment bookings, automatic due creation, tracking, and collection.

### Overview

This module allows partners to enable advance (partial) booking on their reading rooms. Students pay only a portion upfront, and the remaining becomes a tracked "Due". Partners get a full Due Management dashboard, and students see their pending dues on their dashboard.

**Key rule**: When advance is paid, the seat is available to the student only for the number of days proportional to the paid amount (e.g., paid Rs 1000 out of Rs 3000 for 30 days = seat available for 10 days). If the due isn't cleared, the seat becomes available again after those proportional days.

---

### Phase 1: Database Changes

**1a. Add advance booking columns to `cabins` table:**
- `advance_booking_enabled` (boolean, default false)
- `advance_percentage` (numeric, default 50)
- `advance_flat_amount` (numeric, nullable)
- `advance_use_flat` (boolean, default false)
- `advance_validity_days` (integer, default 3)
- `advance_auto_cancel` (boolean, default true)

**1b. Create `dues` table:**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| serial_number | text | Auto via trigger IS-DUES-YYYY-XXXXX |
| booking_id | uuid FK | Links to bookings |
| user_id | uuid | Student |
| cabin_id | uuid | Reading Room |
| seat_id | uuid | Seat |
| total_fee | numeric | Full booking amount |
| advance_paid | numeric | Amount paid upfront |
| due_amount | numeric | Remaining balance |
| due_date | date | Deadline for full payment |
| paid_amount | numeric, default 0 | Total collected so far |
| status | text | pending / overdue / paid / partially_paid / cancelled |
| proportional_end_date | date | Date seat is valid based on paid amount |
| created_at | timestamptz | now() |
| updated_at | timestamptz | now() |

**1c. Create `due_payments` table:**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| due_id | uuid FK | Links to dues |
| amount | numeric | Amount collected |
| payment_method | text | cash/upi/bank_transfer/online |
| transaction_id | text | Reference ID |
| collected_by | uuid | Who collected |
| collected_by_name | text | Name |
| notes | text | Optional notes |
| created_at | timestamptz | now() |

**1d. Triggers and serial numbers:**
- Add serial trigger for dues: `set_serial_dues` using entity type `DUES`
- Add updated_at trigger on dues

**1e. RLS Policies:**
- `dues`: Students SELECT own (user_id = auth.uid()), Admins ALL, Vendors ALL for their cabin's dues (via cabins.created_by join)
- `due_payments`: Same pattern via due_id join to dues

---

### Phase 2: Reading Room Creation/Edit Update

**File: `src/components/admin/CabinEditor.tsx`**

Add a new collapsible section after the Locker section (around line 520) titled "Advance Booking Settings":
- Toggle checkbox: "Allow Advance Booking"
- If enabled, show:
  - Radio: Percentage / Flat Amount
  - Input: Advance Percentage (%) or Flat Amount (Rs)
  - Input: Advance Validity Days (default 3)
  - Toggle checkbox: Auto-cancel if unpaid (default on, label as "Coming Soon" since full auto-cancel cron not yet built)

Add these fields to the `cabin` state object initialization (line 50-86).

**File: `src/pages/RoomManagement.tsx`**

Update `handleSaveCabin` (line 184) to pass advance booking fields to the service:
- `advanceBookingEnabled`, `advancePercentage`, `advanceFlatAmount`, `advanceUseFlat`, `advanceValidityDays`, `advanceAutoCancel`

**File: `src/api/adminCabinsService.ts`**

Update `createCabin` and `updateCabin` to map the new advance booking fields to snake_case columns.

---

### Phase 3: Partner Booking Flow Update

**File: `src/api/vendorSeatsService.ts`**

- Update `VendorCabin` interface to include advance booking fields
- Update `getVendorCabins` to fetch advance booking fields from cabins
- Add `createDueEntry()` function that inserts into `dues` table with computed `proportional_end_date`
- Update `PartnerBookingData` to accept `isAdvanceBooking`, `advancePaid`
- Update `createPartnerBooking`: when advance booking, set payment_status to `advance_paid`, compute proportional days, and call `createDueEntry()`
- Add new service methods:
  - `getAllDues(filters)` -- for Due Management page
  - `getDueSummary()` -- for summary cards
  - `collectDuePayment(dueId, amount, method, txnId)` -- payment collection
  - `getDuePayments(dueId)` -- payment history
  - `getStudentDues()` -- for student dashboard

**File: `src/pages/vendor/VendorSeats.tsx`**

In the booking form section (lines 920-1063):
- Add state: `isAdvanceBooking` (boolean)
- When `selectedCabinInfo` has `advanceBookingEnabled`:
  - Show toggle "Advance Booking" (on by default)
  - When on, compute and display:
    - Total Fee: Rs X
    - Advance Amount: Rs Y (percentage or flat)
    - Remaining Due: Rs Z
    - Proportional Days: computed from advance/total ratio
    - Due Date: start_date + validity_days
  - Update booking summary section to show advance breakdown
- Update `handleCreateBooking` to pass advance data
- Update success view to show advance/due info

**Proportional days rule:**
```
proportionalDays = Math.floor((advancePaid / totalFee) * totalBookingDays)
proportionalEndDate = startDate + proportionalDays
```

---

### Phase 4: Due Management Page (Partner Dashboard)

**New file: `src/pages/admin/DueManagement.tsx`**

Full-featured page with:

**Summary cards (compact, single row):**
- Total Due Amount (all pending dues)
- Overdue Amount (past due_date)
- Due Today (due_date = today)
- Collected This Month (sum of due_payments this month)

**Filters (horizontal bar):**
- Reading Room dropdown
- Status filter (All / Pending / Overdue / Paid / Partially Paid)
- Overdue only toggle
- Search by student name/phone

**Data table columns:**
- Student Name, Mobile, Reading Room, Seat #
- Total Fees, Paid Amount, Due Amount, Due Date
- Proportional End Date
- Days Remaining / Overdue (color-coded number)
- Status badge (Green=Paid, Yellow=Pending, Orange=Partially Paid, Red=Overdue)
- Actions: Collect Amount button

**Collect Amount drawer (Sheet component):**
- Student details header
- Due breakdown (total, advance paid, collected so far, remaining)
- Input: Amount to collect
- Payment mode selector (Cash/UPI/Bank/Online)
- Transaction ID (for UPI/Bank)
- Confirm Collection button
- On confirm:
  - Insert into `due_payments`
  - Update `dues.paid_amount` and recalculate status
  - Update `dues.proportional_end_date` based on new total paid
  - If fully paid, update booking payment_status to `completed`
  - Show success feedback

**File: `src/components/admin/AdminSidebar.tsx`**

Add "Due Management" menu item after the Seat Map item (around line 100):
```
{
  title: 'Due Management',
  url: '/admin/due-management',
  icon: Wallet,
  roles: ['admin', 'vendor', 'vendor_employee'],
  permissions: ['view_bookings']
}
```

**File: `src/App.tsx`**

Add route inside admin routes (around line 142):
```
<Route path="due-management" element={<DueManagement />} />
```

---

### Phase 5: Student Dashboard Updates

**File: `src/pages/StudentDashboard.tsx`**

- Import and use a new `dueService.getStudentDues()` or add to `vendorSeatsService`
- Add "Pending Dues" summary card (after Active Bookings card, around line 304):
  - Shows total pending due amount
  - Red background if overdue
- Add "Dues" tab to TabsList (line 328):
  - Tab content shows due cards with:
    - Reading Room Name, Seat #
    - Total Fee, Paid Amount, Due Amount
    - Due Date, Proportional End Date
    - Status badge with color coding
    - If overdue: red alert with "X days overdue"
    - Note: "Pay Now" button shows payment info/instructions (since online payment flow is not built yet, show the amount and reading room contact)

---

### Phase 6: Proportional Days Logic (Key Rule)

When an advance booking is created:
1. Calculate `proportionalDays = floor((advancePaid / totalFee) * totalBookingDays)`
2. Set `proportional_end_date = startDate + proportionalDays`
3. The booking's effective end date for seat availability becomes `proportional_end_date` until full payment
4. When partner collects more payment, recalculate: `newProportionalDays = floor(((advancePaid + collected) / totalFee) * totalBookingDays)`
5. Update `proportional_end_date` accordingly
6. When fully paid, set `proportional_end_date = booking.end_date` and status to `paid`

**Seat availability impact:**
- In `computeDateStatus` (vendorSeatsService.ts), for bookings with `payment_status = 'advance_paid'`, use `proportional_end_date` from the due entry instead of the booking's `end_date` to determine if seat is booked for a given date

---

### Phase 7: Auto-Cancel (Basic Version)

- In the UI, the "Auto-cancel if unpaid" toggle will be shown but labeled "(Coming Soon)" 
- The proportional days logic already handles seat availability -- after `proportional_end_date`, the seat naturally shows as available
- Full cron-based auto-cancellation can be added later as a scheduled edge function

---

### Files Summary

| Action | File |
|--------|------|
| Migration | New SQL migration (cabins columns + dues + due_payments + RLS + triggers) |
| Edit | `src/components/admin/CabinEditor.tsx` -- advance booking settings section |
| Edit | `src/pages/RoomManagement.tsx` -- pass advance fields in save |
| Edit | `src/api/adminCabinsService.ts` -- map advance fields |
| Edit | `src/api/vendorSeatsService.ts` -- advance booking + due service methods |
| Edit | `src/pages/vendor/VendorSeats.tsx` -- advance toggle in booking form |
| Create | `src/pages/admin/DueManagement.tsx` -- full due management page |
| Edit | `src/components/admin/AdminSidebar.tsx` -- add Due Management menu |
| Edit | `src/App.tsx` -- add due-management route |
| Edit | `src/pages/StudentDashboard.tsx` -- My Dues card + tab |

### Security
- Students see only their own dues (RLS: `auth.uid() = user_id`)
- Partners see dues for their reading rooms only (RLS via cabins.created_by)
- Admins see all (RLS via `has_role`)
- Due payments access inherits from parent due
- Serial numbers auto-generated via SECURITY DEFINER function

