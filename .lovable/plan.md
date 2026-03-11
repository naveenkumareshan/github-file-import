

# Expiring Bookings Pages for Reading Rooms & Hostels

## What We're Building

Two new sidebar items — "Expiring Bookings" under Reading Rooms and "Expiring Bookings" under Hostels — each linking to a dedicated page with date filter controls. Property-scoped for partners/employees, full view for admins.

## Changes

### 1. Service Layer — Add hostel expiring bookings
`src/api/adminBookingsService.ts`:
- Add `getExpiringHostelBookings(daysThreshold, partnerUserId?)` method
- Query `hostel_bookings` with `status = 'confirmed'`, `end_date` between today and today+threshold
- Join profiles (name, email, phone), hostels (name), hostel_beds (bed_number), hostel_rooms (room_number, floor_no)
- Scope by partner's hostel IDs when `partnerUserId` provided

### 2. New Page — `src/pages/admin/ExpiringBookingsPage.tsx`
- Accepts a `type` prop or uses a URL param/tab to distinguish "reading-room" vs "hostel"
- Reuses the existing `ExpiringBookings` component for reading rooms
- Creates a parallel hostel expiring bookings table with same UI pattern (days threshold selector, table with student details, property, floor, bed)
- Uses `getEffectiveOwnerId()` for partner/employee scoping

### 3. Sidebar — Add menu items
`src/components/admin/AdminSidebar.tsx`:
- Add "Expiring Bookings" (Clock icon) below "Bookings" in the Reading Rooms section → links to `${routePrefix}/expiring-bookings`
- Add "Expiring Bookings" (Clock icon) below "Hostel Bookings" in the Hostels section → links to `${routePrefix}/hostel-expiring-bookings`
- Same permission requirements as their parent booking items

### 4. Routes
`src/App.tsx`:
- Add `expiring-bookings` and `hostel-expiring-bookings` routes under both `/admin` and `/partner` route groups

### Files Modified
- `src/api/adminBookingsService.ts` — add `getExpiringHostelBookings`
- `src/pages/admin/ExpiringBookingsPage.tsx` — new page (reading room expiring)
- `src/pages/admin/HostelExpiringBookingsPage.tsx` — new page (hostel expiring)
- `src/components/admin/AdminSidebar.tsx` — add 2 sidebar items
- `src/App.tsx` — add 4 routes (2 admin + 2 partner)

