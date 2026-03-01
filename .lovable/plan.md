
# Fix Partner Profile, Coupons, Create User, Employee Permissions, Routes, and Sidebar Merges

## 1. Partner Profile Not Showing Data

**Root Cause**: The `partners` table has no record for the TestPartner user (user_id: `b7223bac-ef5c-48aa-ba49-d530d15f6f8e`). This user was created before the `admin-create-user` edge function had the partner record creation logic.

**Fix**:
- Modify `VendorProfile.tsx` to auto-create a partner record if one doesn't exist (using data from the `profiles` table) instead of showing "Profile not found".
- In `vendorProfileService.ts`, add a `createProfile()` method that inserts a new partner row using the authenticated user's profile data.
- When `getProfile()` returns "Profile not found", the component will call `createProfile()` to bootstrap the record, then display it for editing.

**Files**: `src/api/vendorProfileService.ts`, `src/components/vendor/VendorProfile.tsx`

---

## 2. Partner-Created Coupons Visible Only to Partner + Admin

**Current State**: The filtering on line 105-111 of `CouponManagement.tsx` already filters by `vendorId` for partners. However, the backend coupon service uses the legacy MongoDB/axios API, so partner filtering depends on what the backend returns.

**Fix**:
- The client-side filter already works. Strengthen it by also ensuring coupons created by a partner (via `createdBy` field) are included in the filter.
- When a partner creates a coupon, force `scope = 'vendor'` and auto-populate `vendorId` -- already partially done but needs verification that the `vendorId` is correctly set from `user.vendorId`.

**Files**: `src/components/admin/CouponManagement.tsx`

---

## 3. Create User Page: Restrict Role Options for Partners

**Current State**: The Create User form shows all 4 role options (Student, Partner, Admin, Employee) for everyone. Partners should only see "Student" and "Employee".

**Fix**:
- In `CreateStudentForm.tsx`, filter `ROLE_OPTIONS` based on the logged-in user's role.
- If `user?.role === 'vendor'`, only show `student` and `vendor_employee` options.
- Remove duplicate "Create" under Employees sidebar (already has "Create User" under Users).

**Files**: `src/components/admin/CreateStudentForm.tsx`, `src/components/admin/AdminSidebar.tsx`

---

## 4. Employee Permissions: Edit vs View Toggle per Sidebar Menu

**Current State**: Permissions are simple checkboxes (e.g., `view_dashboard`, `view_bookings`). There's no distinction between "edit" and "view" access per menu item.

**Fix**:
- Restructure the permissions UI in `VendorEmployeeForm.tsx` to group each sidebar section with two toggle options: "View" and "Edit".
- Map existing permissions: `view_bookings` = View, `manage_bookings` = Edit, etc.
- Display as a table with rows for each sidebar module and columns for View/Edit checkboxes.
- Only "ticked" permissions will be active for the employee.

**Files**: `src/components/vendor/VendorEmployeeForm.tsx`, `src/pages/vendor/VendorEmployees.tsx`

---

## 5. Partner Routes: Use `/partner/` Prefix Instead of `/admin/`

**Current State**: All partner pages use `/admin/` routes (e.g., `/admin/dashboard`, `/admin/rooms`). The breadcrumb says "Partner Panel" but the URL says `/admin/`.

**Fix**:
- This is a significant routing change. Instead of changing all routes (which would break many things), add route aliases so `/partner/*` redirects to the same components.
- Actually, the simpler and safer approach: Add a set of `/partner/*` routes in `App.tsx` that render the same `AdminLayout` and child components. Then update the sidebar links for vendor users to use `/partner/` prefix.
- Update `AdminSidebar.tsx` to dynamically prefix all URLs with `/partner/` when the user role is `vendor` or `vendor_employee`.
- Update `AdminLayout.tsx` breadcrumb mapping to include `/partner/` paths.

**Files**: `src/App.tsx`, `src/components/admin/AdminSidebar.tsx`, `src/components/AdminLayout.tsx`

---

## 6. Merge "Manage Rooms" + "Manage Hostels" and Reviews into Single Sidebar Items

**Current State**: Sidebar has separate "Reading Rooms" and "Hostels" sections, each with their own "Manage" and "Reviews" sub-items for partners.

**Fix for Partners Only**:
- In `AdminSidebar.tsx`, when user is `vendor` or `vendor_employee`, merge "Manage Rooms" and "Manage Hostels" into a single "Manage Properties" sidebar heading.
- Create a new `ManageProperties.tsx` page with two tabs: "Reading Rooms" and "Hostels" that embed existing management components.
- Merge the two "Reviews" links into one "Reviews" page with tab headers for "Reading Rooms" and "Hostels" (the current `ReviewsManagement.tsx` already supports `?module=` query param, so the merged page can use tabs that switch the module).
- Admin sidebar remains unchanged -- only partner sidebar gets the merged view.

**Files**: `src/components/admin/AdminSidebar.tsx`, new `src/pages/partner/ManageProperties.tsx`, new `src/pages/partner/PartnerReviews.tsx`, `src/App.tsx`

---

## Database Migration

- Insert a partner record for the existing TestPartner user so the profile works immediately:
```sql
INSERT INTO partners (user_id, business_name, contact_person, email, phone, status)
SELECT id, COALESCE(name, 'Partner'), COALESCE(name, ''), COALESCE(email, ''), COALESCE(phone, ''), 'approved'
FROM profiles
WHERE id IN (SELECT user_id FROM user_roles WHERE role = 'vendor')
AND id NOT IN (SELECT user_id FROM partners);
```

---

## Implementation Order

1. Database migration to backfill missing partner records
2. Fix partner profile auto-creation fallback
3. Restrict Create User role options for partners
4. Restructure employee permissions UI (View/Edit toggles)
5. Add `/partner/` route aliases and update sidebar links
6. Merge Manage Rooms/Hostels and Reviews for partner sidebar
7. Fix coupon visibility for partners

## Technical Details

### New Files
- `src/pages/partner/ManageProperties.tsx` -- Tabbed page combining Room and Hostel management
- `src/pages/partner/PartnerReviews.tsx` -- Tabbed reviews page for both modules

### Modified Files
- `src/api/vendorProfileService.ts` -- Add `createProfile()` method
- `src/components/vendor/VendorProfile.tsx` -- Auto-create on "not found"
- `src/components/admin/CreateStudentForm.tsx` -- Filter role options by user role
- `src/components/vendor/VendorEmployeeForm.tsx` -- View/Edit permission toggles
- `src/components/admin/AdminSidebar.tsx` -- Partner route prefix, merged sidebar items, remove duplicate employee create
- `src/components/AdminLayout.tsx` -- Add `/partner/` breadcrumb mappings
- `src/App.tsx` -- Add `/partner/*` route aliases, new page routes
- `src/components/admin/CouponManagement.tsx` -- Strengthen partner coupon filtering
