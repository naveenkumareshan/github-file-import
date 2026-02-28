

## Fix: Remove Old Booking View and Route to Correct Page

### Problem
The "View Details" button in CheckInTracker navigates to `/admin/bookings/:bookingId` (no type suffix), which hits the old `AdminBookingView` -- a MongoDB-based page that doesn't work with the current database. The correct, working page is `AdminBookingDetail` at `/admin/bookings/:bookingId/:type`.

### Changes

**1. Update CheckInTracker navigation** (`src/components/admin/operations/CheckInTracker.tsx`)
- Change `handleViewDetails` to include the booking type based on the active module:
  - Reading room: `/admin/bookings/${bookingId}/cabin`
  - Hostel: `/admin/bookings/${bookingId}/hostel`

**2. Remove old route** (`src/App.tsx`, line 147)
- Delete the route `bookings/:bookingId` that points to `AdminBookingView`
- This prevents any accidental navigation to the old page

**3. Delete old file** (`src/pages/AdminBookingView.tsx`)
- Remove this file entirely -- it uses the old MongoDB-based `adminBookingsService` and is no longer needed
- The `StudentBookingView.tsx` file (used by the student route) will remain untouched

**4. Update other references** 
- `DashboardExpiringBookings.tsx` navigates to `/admin/bookings/${booking._id}` without type -- fix to include `/cabin`

### Result
All "View Details" clicks will now open the correct `AdminBookingDetail` page that works with the current database.
