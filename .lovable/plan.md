

## Plan: Remove Dead Code

After thorough analysis, here are the files and code that are confirmed dead (not imported or routed anywhere) and safe to delete.

### Dead Files to Delete

**Unreachable Pages (not in App.tsx routes, not imported anywhere):**
1. `src/pages/HostDashboard.tsx` — Legacy dashboard, not routed or imported
2. `src/pages/Contact.tsx` — Not routed or imported
3. `src/pages/StudentDashboard.tsx` — Not routed or imported (replaced by StudentBookings)
4. `src/pages/BookingDetail.tsx` — Not routed or imported (AdminBookingDetail is used instead)
5. `src/pages/vendor/VendorDashboard.tsx` — Not routed or imported
6. `src/pages/hotelManager/CabinManagement.tsx` — Not routed (the component version in `components/admin/` IS used)
7. `src/pages/hotelManager/CabinSeatsManagement.tsx` — Not routed or imported

**Dead Components:**
8. `src/components/admin/CustomerComplaints.tsx` — Only imported by the dead `HostDashboard.tsx`. Real complaints use `ComplaintsManagement.tsx`
9. `src/components/admin/reports/index.ts` — All exports are commented out, file is empty/useless

**Dead Type Declaration:**
10. `src/gl-matrix.d.ts` — gl-matrix is never imported anywhere in the codebase

### Code to Clean (not full file deletions)

**Deprecated aliases** — These `@deprecated` exports add dead weight but the primary exports they alias ARE used. I will remove only the deprecated aliases, not the main code:
- `src/types/vendor.ts` — Remove `VendorEmployee` and `VendorBooking` deprecated aliases (verify no imports first)
- `src/api/vendorRegistrationService.ts` — Remove `partnerRegistrationService` alias
- `src/api/vendorService.ts` — Remove `partnerService` alias  
- `src/hooks/useVendorEmployeePermissions.ts` — Remove `useVendorEmployeePermissions` and `VendorEmployeePermissions` aliases

### What I will NOT touch
- All axios-based API services (they're imported and used)
- `src/components/admin/settings/` (used by AdminSettingsNew)
- `src/components/forms/LocationSelector.tsx` (used in 5 files)
- `src/components/Navigation.tsx` and `src/components/icons.tsx` (used)
- `src/data/cabinsData.ts` (used for type definitions in Cabins.tsx and CabinsGrid.tsx)
- `src/App.css` (used)
- All components under `seats/`, `booking/`, `dashboard/`, `search/` (used)

### Files to modify/delete
- **Delete**: 10 files listed above
- **Edit**: 4 files to remove deprecated aliases

