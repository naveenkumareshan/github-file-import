

# Fix Partner Reports: Scope Data + Separate Hostel Reports

## Problems Identified
1. **Occupancy tab** (`getOccupancyReports`) fetches ALL cabins globally — no `created_by` filter for partners
2. **Revenue tab** (`getRevenueReport`) fetches ALL bookings — no cabin ownership filter
3. **Transactions tab** (`getAllBookings` via `BookingTransactions`) fetches ALL bookings — no cabin scoping
4. **Expiring Bookings** (`getExpiringBookings`) also unscoped
5. **"Hostel Reports"** sidebar link just redirects to the same BookingReportsPage with `?tab=transactions` — there is no actual hostel-specific report page
6. Partners without hostels still see "Hostel Reports" in the sidebar

## Plan

### 1. Add partner scoping to all report service functions

**`src/api/adminBookingsService.ts`** — Add optional `partnerUserId?: string` to:
- `getOccupancyReports`: Filter cabins by `.eq('created_by', partnerUserId)`
- `getRevenueReport`: First fetch partner's cabin IDs, then filter bookings with `.in('cabin_id', cabinIds)`
- `getAllBookings`: Same cabin ID scoping pattern
- `getExpiringBookings`: Same cabin ID scoping pattern

### 2. Pass partner context from report components

**`src/components/admin/reports/BookingReportsPage.tsx`**:
- Import `useAuth` and `getEffectiveOwnerId`
- Resolve `partnerUserId` for vendor/vendor_employee roles
- Pass it down as a prop to `RevenueReports`, `OccupancyReports`, `BookingTransactions`, `ExpiringBookings`
- Conditionally show "Hostel Reports" tab only if partner has hostels (use `usePartnerPropertyTypes`)

**`src/components/admin/reports/OccupancyReports.tsx`**:
- Accept `partnerUserId?: string` prop
- Pass to `getOccupancyReports`

**`src/components/admin/reports/RevenueReports.tsx`**:
- Accept `partnerUserId?: string` prop  
- Pass to `getRevenueReport`

**`src/components/admin/reports/BookingTransactions.tsx`**:
- Accept `partnerUserId?: string` prop
- Pass to `getAllBookings` via a `cabinId` filter or new param

**`src/components/admin/reports/ExpiringBookings.tsx`**:
- Accept `partnerUserId?: string` prop
- Pass to `getExpiringBookings`

### 3. Fix sidebar: hide "Hostel Reports" when partner has no hostels

**`src/components/admin/AdminSidebar.tsx`** (lines 486-505):
- Use `usePartnerPropertyTypes` to conditionally include "Hostel Reports" only when `hasHostels` is true
- For now, "Hostel Reports" link can stay pointing to the same page but with hostel-specific tab (or be hidden entirely until a dedicated hostel reports page is built)

### 4. Files to modify
- `src/api/adminBookingsService.ts` — add `partnerUserId` to 4 functions
- `src/components/admin/reports/BookingReportsPage.tsx` — resolve partner context, pass down
- `src/components/admin/reports/OccupancyReports.tsx` — accept + use `partnerUserId`
- `src/components/admin/reports/RevenueReports.tsx` — accept + use `partnerUserId`
- `src/components/admin/reports/BookingTransactions.tsx` — accept + use `partnerUserId`
- `src/components/admin/reports/ExpiringBookings.tsx` — accept + use `partnerUserId`
- `src/components/admin/AdminSidebar.tsx` — conditionally show Hostel Reports

