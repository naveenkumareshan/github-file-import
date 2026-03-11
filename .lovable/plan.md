

# Fix: Scope Calendar View + Build Error

## Problems
1. **Calendar tab** in `BookingCalendarDashboard` fetches ALL cabins via `cabinsService.getAllCabins()` (no partner filter) and ALL bookings via `adminBookingsService.getAllBookings()` (no partner filter passed)
2. **Build error**: `NodeJS.Timeout` type in `src/pages/Cabins.tsx` line 46

## Changes

### 1. `src/components/admin/BookingCalendarDashboard.tsx`
- Accept optional `partnerUserId?: string` prop
- In `fetchCabins`: if `partnerUserId` is set, query cabins with `.eq('created_by', partnerUserId)` instead of using `cabinsService.getAllCabins()`
- In `fetchBookings`: pass `partnerUserId` to `adminBookingsService.getAllBookings()` (already supports it from prior fix)

### 2. `src/components/admin/reports/BookingReportsPage.tsx`
- Pass `partnerUserId` to `BookingCalendarDashboard` component

### 3. `src/pages/Cabins.tsx` — fix build error
- Change `NodeJS.Timeout` to `ReturnType<typeof setTimeout>` on line 46

