

## Create Hostel Due Management -- Same as Reading Room Due Management

### Overview
Build a hostel due management page identical to the reading room `DueManagement.tsx`, with the same summary cards, filters, table columns, collect payment drawer, receipts dialog, and payment history.

### Database Changes

Since hostel bookings track `advance_amount` and `remaining_amount` but lack a dedicated dues tracking system (no proportional end date, no due date, no partial payment tracking), we need two new tables:

**`hostel_dues` table** (mirrors `dues` table):
- `id` (uuid, PK)
- `user_id` (uuid, NOT NULL)
- `hostel_id` (uuid, NOT NULL)
- `room_id` (uuid, nullable)
- `bed_id` (uuid, nullable)
- `booking_id` (uuid, nullable)
- `total_fee` (numeric, default 0)
- `advance_paid` (numeric, default 0)
- `due_amount` (numeric, default 0)
- `paid_amount` (numeric, default 0)
- `due_date` (date, NOT NULL)
- `proportional_end_date` (date, nullable)
- `status` (text, default 'pending') -- pending, partially_paid, paid
- `serial_number` (text, nullable) -- auto-generated with 'HDUES' prefix
- `created_at`, `updated_at` (timestamps)

**`hostel_due_payments` table** (mirrors `due_payments` table):
- `id` (uuid, PK)
- `due_id` (uuid, NOT NULL)
- `amount` (numeric, default 0)
- `payment_method` (text, default 'cash')
- `transaction_id` (text, default '')
- `collected_by` (uuid, nullable)
- `collected_by_name` (text, default '')
- `notes` (text, default '')
- `created_at` (timestamp)

**RLS Policies** (same pattern as `dues` / `due_payments`):
- Admins can manage all
- Students can view own (by user_id)
- Partners can manage for own hostels (via hostels.created_by join)

**Serial number trigger**: Add `set_serial_hostel_dues` function + trigger using 'HDUES' prefix.

### New Page: `src/pages/admin/HostelDueManagement.tsx`

Mirrors `DueManagement.tsx` exactly with hostel data:

**Summary Cards** (4 cards, same layout):
- Total Due (red wallet icon)
- Overdue (red triangle icon)
- Due Today (amber calendar icon)
- Collected This Month (green rupee icon)

**Filters**:
- Hostel dropdown (replaces "All Rooms") -- queries `hostels` table
- Status filter (All, Pending, Partially Paid, Paid)
- Search by student name/phone
- Search button

**Table Columns** (same as reading room):
| Column | Data Source |
|--------|-----------|
| Student (name, phone, email) | `profiles:user_id` join |
| Hostel / Bed | `hostels:hostel_id(name)` + `hostel_beds:bed_id(bed_number)` |
| Booking | `hostel_bookings:booking_id(serial_number)` |
| Total (right-aligned) | `total_fee` |
| Paid (right-aligned, green) | `advance_paid + paid_amount` |
| Due (right-aligned, red) | `due_amount - paid_amount` |
| Due Date + days info | `due_date` with overdue/today/days-left logic |
| Bed Valid | `proportional_end_date` |
| Status badge | pending/partial/paid/overdue |
| Actions | Collect button + Receipts button |

**Collect Payment Drawer** (right sheet, same layout):
- Student info card with name, phone
- Financial summary: Total Fee, Advance Paid, Collected So Far, Remaining Due
- Amount input
- Payment method radio (Cash, UPI, Bank, Online)
- Transaction ID (conditional)
- Notes textarea
- Confirm Collection button
- Payment History component below

**Receipts Dialog** (same format):
- Shows all `hostel_receipts` for the booking
- Each receipt card: serial number, type badge, amount, method, date, collected by, txn ID, notes

### Data Flow

All queries go directly to the database (same pattern as reading room dues):

1. **Fetch dues**: Query `hostel_dues` with joins to `profiles`, `hostels`, `hostel_beds`, `hostel_bookings`
2. **Summary**: Aggregate from `hostel_dues` (total due, overdue, due today) + `hostel_due_payments` (collected this month)
3. **Collect payment**: Insert into `hostel_due_payments`, update `hostel_dues` (paid_amount, status, proportional_end_date), create `hostel_receipts` entry with `receipt_type = 'due_collection'`, update `hostel_bookings.payment_status` if fully paid
4. **Proportional end date logic**: Same as reading room -- calculates how many days of the booking period are covered by total payments so far

### Due Creation

When a hostel booking is created with `payment_status = 'advance_paid'`, a corresponding `hostel_dues` entry should be created. This will be handled:
- In the Bed Map booking flow (HostelBedMap.tsx) -- after creating a booking with advance payment, also insert into `hostel_dues`
- In `hostelBookingService.createBooking` -- add due creation when payment_status is 'advance_paid'

### Payment History Component

Create `HostelDuePaymentHistory.tsx` (mirrors `DuePaymentHistory.tsx`) that queries `hostel_due_payments` for a given due_id and displays payment entries in a collapsible list.

### Navigation

Add "Due Management" link under the Hostels section in AdminSidebar, positioned after "Bed Map" (same position as reading room's due management).

### Route

Add `/admin/hostel-due-management` route in `App.tsx`.

### Files to Create/Modify

| File | Action | Description |
|---|---|---|
| Database migration | New | Create `hostel_dues` and `hostel_due_payments` tables with RLS + serial trigger |
| `src/pages/admin/HostelDueManagement.tsx` | New | Full page mirroring DueManagement.tsx with hostel data |
| `src/components/booking/HostelDuePaymentHistory.tsx` | New | Payment history component for hostel dues |
| `src/components/admin/AdminSidebar.tsx` | Edit | Add "Due Management" link under Hostels section |
| `src/App.tsx` | Edit | Add route for `/admin/hostel-due-management` |
| `src/pages/admin/HostelBedMap.tsx` | Edit | Create hostel_dues entry when booking with advance payment |
| `src/api/hostelBookingService.ts` | Edit | Create hostel_dues entry in createBooking when advance_paid |

