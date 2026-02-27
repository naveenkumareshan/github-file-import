

## Align Hostel Bookings, Receipts, and Deposits with Reading Room UI

### Overview
Three hostel admin pages need to be rewritten to match their reading room counterparts exactly in UI, data fetching, and functionality.

---

### 1. Hostel Bookings Page (`AdminHostelBookings.tsx`)

**Current state**: Basic table with tabs, no pagination, no amount column, different layout from `AdminBookings.tsx`.

**Changes** (rewrite to match `AdminBookings.tsx`):
- Same card layout with breadcrumb header
- Same columns: Booking ID, Student (name + email), Hostel, Room/Bed, Booked On, Duration (range + type), Amount, Status, Actions (eye icon with tooltip)
- Pagination at 15 records per page with "Showing X-Y of Z" footer
- Search by name, email, serial number
- Status filter dropdown (All, Confirmed, Pending, Cancelled)
- Keep the Calendar & Occupancy tab
- View action navigates to `/admin/bookings/{id}/hostel` (already works)

### 2. Admin Booking Detail (`AdminBookingDetail.tsx`)

**Current state**: Already supports `type=hostel` but has critical data mapping bugs:
- Fetches receipts from `receipts` table instead of `hostel_receipts` for hostel bookings
- Fetches dues from `dues` table instead of checking hostel-specific data
- Uses MongoDB-style field names (`booking.userId`, `booking.cabinId`, `booking.seatId`) which don't match Supabase hostel data shape (`booking.profiles`, `booking.hostels`, `booking.hostel_rooms`)
- Invoice download uses wrong field mapping for hostel bookings

**Changes**:
- When `bookingType === 'hostel'`:
  - Fetch receipts from `hostel_receipts` table instead of `receipts`
  - Map data correctly: `booking.profiles?.name` instead of `booking.userId?.name`, `booking.hostels?.name` instead of `booking.cabinId?.name`, `booking.hostel_rooms?.room_number` / `booking.hostel_beds?.bed_number` instead of `booking.seatId?.number`
  - Show "Hostel" and "Room/Bed" labels instead of "Room" and "Seat"
  - Payment summary: show Total Price, Advance, Security Deposit, Remaining, Due Collected, Total Collected, Due Remaining
  - Invoice generation: map hostel fields properly (hostel name, room number, bed number)
  - Wrap `hostelService.getBookingById` response in `{ success: true, data: ... }` format OR adapt the detail page to handle raw data

### 3. Hostel Receipts Page (`HostelReceipts.tsx`)

**Current state**: Simple table with basic search and type filter. Missing: room filter, date range, summary bar, Txn ID / Notes column, Collected By, Booking ID column, same column layout as `Receipts.tsx`.

**Changes** (rewrite to match `Receipts.tsx`):
- Summary bar at top: Total amount, Booking Payments total, Due Collections total
- Filters: Search, Hostel filter dropdown, Type filter, From/To date pickers, Clear button
- Table columns (same order as `Receipts.tsx`): Receipt #, Student (name + phone + email), Hostel / Room, Amount, Method, Type (badge), Booking ID (serial), Collected By, Txn ID / Notes, Date
- Fetch related data (profiles, hostels, hostel_rooms, hostel_bookings) and join client-side (same pattern as `Receipts.tsx`)

### 4. Hostel Deposits Page (`HostelDeposits.tsx`)

**Current state**: Simple flat table with search and inline refund button. No tabs for Deposits/Refund Management/Refunded separation.

**Changes** (rewrite to match `DepositAndRestrictionManagement.tsx`):
- Wrap in Tabs component with 3 tabs: Deposits, Refund Management, Refunded
- Deposits tab: List all hostel bookings with `security_deposit > 0`, same table columns as reading room deposits (Booking ID, User, Hostel, Room/Bed, Deposit amount, Date, Status)
- Refund Management tab: Show pending refunds with refund dialog (amount, reason, method, transaction ID, image upload)
- Refunded tab: Show completed refunds with transaction details
- Both refund tabs use the same pattern as `RefundManagement.tsx` but query `hostel_bookings` and `hostel_receipts` instead of the backend API

**Note**: The reading room deposits use a backend API (`depositRefundService`) connected to MongoDB. For hostels, we'll query directly from the database since all hostel data is in the cloud database. The refund dialog will create a `hostel_receipts` entry with `receipt_type = 'deposit_refund'` and update the booking's `security_deposit` to 0 (current pattern, but wrapped in the tabbed UI).

---

### Files to Change

| File | Action | Description |
|---|---|---|
| `src/pages/hotelManager/AdminHostelBookings.tsx` | Rewrite | Match AdminBookings layout with pagination, columns, eye icon actions |
| `src/pages/AdminBookingDetail.tsx` | Edit | Fix hostel data mapping, fetch from hostel_receipts, correct field names |
| `src/pages/admin/HostelReceipts.tsx` | Rewrite | Match Receipts.tsx with summary bar, filters, full column set |
| `src/pages/admin/HostelDeposits.tsx` | Rewrite | Add 3-tab layout matching DepositAndRestrictionManagement, refund dialog |
| `src/api/hostelService.ts` | Edit | Wrap getBookingById response in `{ success, data }` format for consistency |

