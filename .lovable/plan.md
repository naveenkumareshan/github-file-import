
# Partner Data Isolation and Feature Fixes

This is a large set of changes to ensure partners only see their own data and have the correct level of access across the entire application.

---

## Issues and Fixes

### 1. Reading Rooms showing all properties to all partners

**Problem**: `adminCabinsService.getAllCabins()` queries `supabase.from('cabins').select('*')` without filtering. RLS has RESTRICTIVE policies for "Anyone can view active cabins" and "Partners can manage own cabins" -- but all restrictive policies with no permissive policies means NO rows are returned. The fact that it works at all suggests the policies may be behaving as permissive. Partners currently see all cabins.

**Fix**: Add explicit `created_by` filter in `adminCabinsService.getAllCabins()` when the logged-in user is not an admin. Pass the user ID from the calling component (RoomManagement.tsx) so the service filters `created_by = userId`.

**Files**: `src/api/adminCabinsService.ts`, `src/pages/RoomManagement.tsx`

### 2. Hide Seats/Beds buttons from partners in Manage Rooms/Hostels

**Problem**: CabinItem shows a "Seats" button and HostelItem shows a "Beds" button for partners. Partners should not have access to seat/bed management -- only view-only + pause/enable.

**Fix**: In `CabinItem.tsx`, hide the "Seats" button for non-admin users. In `HostelItem.tsx`, hide the "Beds" and "Packages" buttons for non-admin users.

**Files**: `src/components/admin/CabinItem.tsx`, `src/components/admin/HostelItem.tsx`

### 3. Students/Employees filtering for partners

**Problem**: Partners see ALL students/employees instead of only those related to their properties. Also, partners should not be able to view full student details -- only name, phone, email, and related bookings.

**Fix**:
- In `adminUsersService.getUsers()`, add a `partnerUserId` filter parameter. When set, first fetch the partner's cabin/hostel IDs, then get user IDs from bookings on those properties, and filter profiles to only those users.
- In `AdminStudents.tsx`, pass the current user's ID as `partnerUserId` when role is `vendor`.
- For partner's "View" action on students, show a simplified dialog with only name, phone, email, and their bookings at the partner's properties (not full details with edit).

**Files**: `src/api/adminUsersService.ts`, `src/pages/AdminStudents.tsx`

### 4. Partner-scoped coupons

**Problem**: Coupons use the legacy MongoDB/axios backend (`couponService.ts`). Partners can see all coupons and create coupons that are globally visible.

**Fix**: This is a significant migration since the entire coupon system runs on the legacy backend. For now, the practical fix is:
- Filter the coupon list on the frontend: when a partner is logged in, only show coupons where `scope === 'vendor'` and `vendorId` matches the partner's ID, or `scope === 'global'` (read-only).
- When a partner creates a coupon, force `scope = 'vendor'` and auto-set `vendorId` to the partner's own ID.
- Hide Edit/Delete buttons for global coupons when logged in as a partner.

**Files**: `src/components/admin/CouponManagement.tsx`

### 5. Employee management with new UI

**Problem**: Employee management (`VendorEmployees.tsx`) uses the legacy MongoDB/axios backend (`vendorService.getEmployees()`). It needs migration to the Supabase backend and a refreshed UI with salary fields, edit/view mode, and sidebar permission sharing.

**Fix**:
- Create a `vendor_employees` table in the database (id, partner_user_id, user_id, name, email, phone, role, permissions, status, salary, created_at, updated_at) with RLS policies.
- Create a new `vendorEmployeeService.ts` using Supabase queries.
- Rewrite `VendorEmployees.tsx` with a modern table-based UI showing employee name, role, permissions, salary, status, and Edit/View actions.
- Update `VendorEmployeeForm.tsx` to include salary field and permission checkboxes matching sidebar items.

**Database Migration**: Create `vendor_employees` table with RLS.

**Files**: New migration, `src/api/vendorEmployeeService.ts` (new), `src/pages/vendor/VendorEmployees.tsx`, `src/components/vendor/VendorEmployeeForm.tsx`

### 6. Partner profile page not showing data

**Problem**: The profile page fetches from `vendorProfileService.getProfile()` which queries the `partners` table. The issue is likely that the partner record doesn't exist (wasn't created when the user was created), or RLS is blocking the read.

**Fix**:
- Debug and verify the `partners` table has a record for the logged-in partner with matching `user_id`.
- Ensure RLS SELECT policy for "Partners can view own record" is correct (it uses `auth.uid() = user_id` which should work).
- Add a "Documents" tab to the profile page for uploading business documents (Aadhar, PAN, GST certificate, cancelled cheque, site photos) using the existing storage system.
- Add all editable fields: business name, type, contact person, phone, address, GST number, PAN, Aadhar, bank details (account holder, account number, bank name, IFSC, UPI ID).

**Files**: `src/components/vendor/VendorProfile.tsx`, `src/api/vendorProfileService.ts`

### 7. Complaints visible only for partner's own properties

**Problem**: Complaints page is admin-only in the sidebar (`roles: ['admin']`). Partners cannot see complaints at all.

**Fix**:
- Add Complaints to the partner's sidebar menu under a suitable section.
- Filter complaints to only show those linked to the partner's cabins/hostels (`cabin_id` or `hostel_id` belonging to the partner).
- Add RLS policy for vendors to view complaints for their own properties.

**Database Migration**: Add RLS policy on `complaints` table for vendors to SELECT complaints where `cabin_id` is in their cabins or `hostel_id` is in their hostels.

**Files**: `src/components/admin/AdminSidebar.tsx`, RLS migration for complaints

---

## Implementation Order

1. **Database migrations**: Create `vendor_employees` table + RLS; add vendor complaint access policy
2. **Property filtering**: Fix cabin/hostel services to filter by partner
3. **Hide Seats/Beds buttons**: Update CabinItem and HostelItem
4. **Student/Employee filtering**: Update AdminStudents and adminUsersService
5. **Coupon scoping**: Filter CouponManagement for partners
6. **Employee management rewrite**: New service + UI with salary and permissions
7. **Partner profile fix**: Debug data, add documents tab
8. **Complaints access**: Add sidebar item + filtering for partners

## Files to Create/Modify

### New Files:
- Database migration for `vendor_employees` table
- Database migration for complaints RLS vendor policy
- `src/api/vendorEmployeeService.ts`

### Modified Files:
- `src/api/adminCabinsService.ts` -- add partner filter
- `src/pages/RoomManagement.tsx` -- pass partner filter
- `src/components/admin/CabinItem.tsx` -- hide Seats button for partners
- `src/components/admin/HostelItem.tsx` -- hide Beds/Packages buttons for partners
- `src/api/adminUsersService.ts` -- add partner-scoped user filtering
- `src/pages/AdminStudents.tsx` -- simplified view for partners, filter users
- `src/components/admin/CouponManagement.tsx` -- partner-scoped coupon filtering
- `src/pages/vendor/VendorEmployees.tsx` -- full rewrite with new UI
- `src/components/vendor/VendorEmployeeForm.tsx` -- add salary, permissions
- `src/components/vendor/VendorProfile.tsx` -- add documents tab, fix data display
- `src/api/vendorProfileService.ts` -- add document upload support
- `src/components/admin/AdminSidebar.tsx` -- add Complaints for partners
