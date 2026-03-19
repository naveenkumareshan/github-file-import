

## Fix: Activity Log Showing Mixed Booking Types

### Problem
Both the Reading Room and Hostel sidebar/menu entries link to the same `/booking-activity-log` route. The `BookingActivityLog` component fetches **all** logs without filtering by `booking_type`, so hostel logs appear under reading room and vice versa.

### Solution
Use a URL query parameter (`?type=cabin` or `?type=hostel`) to scope the activity log by booking type.

### Changes

**1. Update sidebar/menu links to pass `?type=` query param**

- `src/components/admin/AdminSidebar.tsx`
  - Reading Room activity log link: `/booking-activity-log?type=cabin`
  - Hostel activity log link: `/booking-activity-log?type=hostel`

- `src/components/partner/PartnerMoreMenu.tsx`
  - Reading Room section: `/booking-activity-log?type=cabin`
  - Hostel section: `/booking-activity-log?type=hostel`

**2. Update `src/pages/admin/BookingActivityLog.tsx` to read and apply the type filter**

- Read `type` from `useSearchParams()` (values: `cabin`, `hostel`, or absent for all)
- Apply `.eq('booking_type', type)` filter to the query when `type` is present
- Update breadcrumb/header to show "Reading Room Activity Log" or "Hostel Activity Log" accordingly
- Add a booking type toggle (Cabin / Hostel / All) so users can switch without going back to sidebar

**3. Update `src/hooks/usePartnerNavPreferences.ts`**
- Change activity-log URL to default to `/partner/booking-activity-log` (no type filter — shows all, which is fine for the general nav entry)

### Files Modified
- `src/components/admin/AdminSidebar.tsx` — add `?type=cabin` / `?type=hostel` to URLs
- `src/components/partner/PartnerMoreMenu.tsx` — same URL param additions
- `src/pages/admin/BookingActivityLog.tsx` — read query param, filter by `booking_type`

