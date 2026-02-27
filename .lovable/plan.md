

## Add Hostel Booking Calendar View and Occupancy Dashboard

### Overview

Add a calendar view and occupancy dashboard specifically for hostel bookings, accessible to both admins and partners. This reuses the existing calendar pattern from the reading room `BookingCalendarDashboard` but queries `hostel_bookings` and `hostels` instead.

---

### 1. Create `HostelBookingCalendarDashboard` Component

**New file**: `src/components/admin/HostelBookingCalendarDashboard.tsx`

A calendar + occupancy component similar to the existing `BookingCalendarDashboard`, but for hostels:

- **Data source**: `hostelBookingService.getAllBookings()` filtered by month range, plus `hostelService.getAllHostels()` (admin) or `hostelService.getUserHostels()` (partner) for the hostel filter dropdown
- **Calendar grid**: Monthly view showing colored bars per booking, each bar spanning `start_date` to `end_date`
- **Hostel filter**: Dropdown to filter by specific hostel (using cloud DB fields: `hostel.id`, `hostel.name`)
- **Legend**: Color-coded by hostel name
- **Occupancy summary cards** at the top:
  - Total active bookings this month
  - Occupancy rate (confirmed bookings / total beds across selected hostels)
  - Revenue this month (sum of `total_price` for confirmed bookings)
  - Pending bookings count
- **Occupancy chart**: Bar chart showing per-hostel bed occupancy percentage using `hostel_beds` counts vs active bookings
- Field mapping (all cloud DB):
  - `booking.serial_number` for tooltip
  - `booking.profiles?.name` for guest name
  - `booking.hostels?.name` for hostel label
  - `booking.hostel_rooms?.room_number` and `booking.hostel_beds?.bed_number` for detail
  - `booking.start_date` / `booking.end_date` for bar span
  - `booking.status` and `booking.payment_status` for filtering

---

### 2. Add Calendar Tab to Admin Hostel Bookings Page

**Edit**: `src/pages/hotelManager/AdminHostelBookings.tsx`

Add a new tab "Calendar & Occupancy" alongside the existing All/Confirmed/Pending/Cancelled tabs:
- Import `HostelBookingCalendarDashboard`
- Add a `TabsTrigger` with value `calendar` and a Calendar icon
- Add a `TabsContent` rendering `<HostelBookingCalendarDashboard />`
- The calendar tab won't trigger the list `fetchBookings` call (only the list tabs do)

---

### 3. Add Sidebar Link (optional shortcut)

**Edit**: `src/components/admin/AdminSidebar.tsx`

No new sidebar item needed -- the calendar is accessed via a tab within the existing "Hostel Bookings" page, keeping navigation clean.

---

### Files Changed

| File | Action |
|---|---|
| `src/components/admin/HostelBookingCalendarDashboard.tsx` | New -- hostel calendar view + occupancy stats |
| `src/pages/hotelManager/AdminHostelBookings.tsx` | Edit -- add "Calendar & Occupancy" tab |

### Technical Notes

- The component uses `hostelBookingService.getAllBookings()` which already supports partner-level RLS (partners only see bookings for their own hostels), so no additional filtering is needed
- Occupancy rate is calculated client-side: fetch total beds from `hostel_beds` table for selected hostels, count confirmed bookings overlapping current month
- The same component works for both admin and partner roles since the service layer handles access control via RLS policies

