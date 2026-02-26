

## Remove "Transfer Seat" and "Manual Booking" from Admin Panel

### Current State
The sidebar menu code in `AdminSidebar.tsx` does **not** contain "Transfer Seat" or "Manual Booking" entries -- they were previously removed. However, residual references still exist in:
1. **`AdminLayout.tsx`** -- route labels in the breadcrumb still list both (`/admin/seat-transfer` and `/admin/manual-bookings`)
2. **`App.tsx`** -- routes for `/admin/seat-transfer` (line 112) and `/admin/manual-bookings` (lines 139-140) still exist

These routes are still accessible via direct URL and show in the breadcrumb when navigated to.

### Changes

**1. `src/components/AdminLayout.tsx`**
- Remove the route label entries for `/admin/seat-transfer` ("Transfer Seat") and `/admin/manual-bookings` ("Manual Booking") from the `routeLabels` object

**2. `src/App.tsx`**
- Remove the route for `seat-transfer` (line 112)
- Remove the two routes for `manual-bookings` (lines 139-140)
- Remove the lazy import for `SeatTransferManagementPage` (line 36)
- Remove the lazy import for `ManualBookingManagement` (line 22)

### Note on Build Errors
The `gl-matrix` TypeScript errors are from a third-party dependency (`node_modules/gl-matrix`) and are unrelated to our code. They do not affect the application's runtime behavior.

### Files to Modify
- `src/components/AdminLayout.tsx` -- remove 2 route label entries
- `src/App.tsx` -- remove 2 lazy imports and 3 route definitions

