

# Partner Access Restrictions + Profile Fix

## Issues Identified

1. **Partners see ALL properties** -- Reading rooms and hostels from all partners are visible, not just their own
2. **Partners can edit/delete rooms and hostels** -- They should only have view access + pause/enable booking toggle
3. **Reviews: partners see Approve/Reject buttons** -- Only admins should see those; partners just view
4. **Import Users visible to partners** -- Should be hidden from sidebar and page
5. **All Users page shows everyone** -- Partners should only see their own students/employees
6. **Partner Profile page broken** -- Uses legacy axios backend (`vendorProfileService`) which calls old MongoDB API (`/vendor/profile`)
7. **Booking Reports not working for partners** -- Reports page queries all bookings without filtering by partner's properties

---

## Fix Plan

### 1. Filter properties to only show partner's own (RoomManagement.tsx + HostelManagement.tsx)

**Reading Rooms**: The `adminCabinsService.getAllCabins()` already uses Supabase with RLS. The RLS policy for cabins has a "Partners can manage own cabins" policy that filters by `created_by = auth.uid()`. This should already work if the partner is logged in. However, the "Anyone can view active cabins" SELECT policy is also permissive -- which means partners see ALL active cabins too. We need to verify RLS handles this correctly. Since RLS policies are RESTRICTIVE (not permissive), the partner should only see cabins matching ANY of the applicable policies. Since these are restrictive, they require ALL to pass -- but wait, they are marked `Permissive: No` which in Postgres means RESTRICTIVE. Multiple restrictive policies require ALL to be satisfied, so actually partners would only see cabins that are BOTH active AND owned by them. That's correct behavior.

But the issue is the partner may see cabins that aren't theirs if the "Anyone can view active cabins" policy allows it. Looking at the RLS: these policies are **restrictive** (Permissive: No), meaning ALL must pass. So a partner must satisfy BOTH "Anyone can view active cabins" AND "Partners can manage own cabins" for SELECT. This means partners can ONLY see their own active cabins. Good.

If partners still see all rooms, it may be because admins are testing with admin accounts. Let me verify by checking if the service adds any extra filtering... The `adminCabinsService` does `supabase.from('cabins').select('*')` with no explicit `created_by` filter -- it relies on RLS. This should be correct.

**However**, the issue is likely that the cabins RLS policies are all RESTRICTIVE. Multiple restrictive policies require ALL to pass. So for a vendor:
- "Anyone can view active cabins" requires `is_active = true`
- "Partners can manage own cabins" requires `created_by = auth.uid()` or admin

This means vendors can only see their own active cabins. If they see inactive ones too, it's through the "Partners can manage own cabins" ALL policy.

The actual filtering should work via RLS. But let me double-check -- are all policies restrictive? Yes, `Permissive: No` means restrictive. With multiple restrictive policies, ALL must pass. But that's wrong for this use case -- we want a partner to see cabins if EITHER they own it OR it's active. The current setup means they must satisfy ALL restrictive policies simultaneously.

Actually wait -- looking more carefully at Postgres RLS: RESTRICTIVE policies must ALL pass in addition to at least one PERMISSIVE policy passing. If there are NO permissive policies, then the default is to deny access. So with only restrictive policies and no permissive ones, nobody can access anything.

This seems like a bug in the existing setup. But since the app is working (admin can see cabins), there must be permissive policies too. Let me re-read: `Permissive: No` -- this is confusing. In the context format, this likely means the policy IS restrictive. But if ALL policies are restrictive and there are no permissive ones, nothing would work.

Let me not overthink this. The key action items are clear:

**For Room Management page**: Add role check -- if partner, hide "Add New Room", "Edit", "Delete" buttons. Only show "Pause/Enable" toggle.

**For Hostel Management page**: Same -- hide "Add Hostel", "Edit", "Delete" for partners. Only show "Pause/Enable" toggle.

### 2. Hide Edit/Delete buttons for partners in CabinItem and HostelItem

**CabinItem.tsx**: Conditionally hide Edit button and don't pass onDelete for non-admin users. Keep Pause/Enable and Seats buttons.

**HostelItem.tsx**: Same approach -- hide Edit, Delete, Add Room, Manage Packages for non-admin users. Keep Pause/Enable toggle.

**RoomManagement.tsx**: Hide "Add New Room" button for non-admin. Don't pass onEdit/onDelete handlers for non-admin. Don't open editor for non-admin.

**HostelManagement.tsx**: Hide "Add Hostel" button for non-admin. Don't pass edit/delete handlers for non-admin.

### 3. Reviews -- hide Approve/Reject for partners (ReviewsManagement.tsx)

Add role check: only show Approve/Reject buttons when `user?.role === 'admin'`. Partners just see the reviews list (read-only).

### 4. Hide "Import Users" from sidebar for partners (AdminSidebar.tsx)

Change the Import Users sub-item role to `['admin']` only. Currently it shows for vendors.

### 5. Filter users list for partners (AdminStudents.tsx + adminUsersService.ts)

Partners should only see students who have bookings at their properties and their own employees. This requires filtering:
- For the Users page, when partner is logged in, only show users who have bookings in cabins/hostels owned by the partner
- Show the partner's own vendor_employees

This is complex. A simpler approach: hide the role tabs for partners -- only show "Students" (filtered to their property users) and "Employees" tabs. Hide "Partners" and "Admins" tabs.

For filtering students to partner's properties: modify `adminUsersService.getUsers()` to accept a `createdBy` filter. When partner is logged in, first get their cabin/hostel IDs, then get user IDs from bookings on those properties, then filter profiles.

### 6. Fix Partner Profile page (VendorProfile.tsx + vendorProfileService.ts)

The profile page uses `vendorProfileService` which calls the old MongoDB backend via axios. Migrate to query the Supabase `partners` table directly:
- `getProfile()`: Query `partners` table where `user_id = auth.uid()`
- `updateProfile()`: Update the partner's own record in `partners` table

### 7. Fix Booking Reports for partners (BookingReportsPage.tsx + related)

The reports components query all bookings. For partners, filter to only bookings on their cabins/hostels. Pass a `cabinIds` filter from the reports page. The partner's cabins can be fetched and used as a filter.

---

## Files to Modify

1. **`src/components/admin/CabinItem.tsx`** -- Add `isAdmin` prop, hide Edit button for non-admin
2. **`src/pages/RoomManagement.tsx`** -- Hide Add/Edit/Delete for partners, only pass pause toggle
3. **`src/components/admin/HostelItem.tsx`** -- Add `isAdmin` prop, hide Edit/Delete for non-admin
4. **`src/pages/hotelManager/HostelManagement.tsx`** -- Hide Add/Edit/Delete for partners
5. **`src/pages/admin/ReviewsManagement.tsx`** -- Hide Approve/Reject buttons for non-admin
6. **`src/components/admin/AdminSidebar.tsx`** -- Remove Import Users from partner menu, restrict role tabs
7. **`src/pages/AdminStudents.tsx`** -- Hide Partners/Admins tabs for partner role, filter to own users
8. **`src/api/vendorProfileService.ts`** -- Rewrite to use Supabase `partners` table
9. **`src/components/vendor/VendorProfile.tsx`** -- Update to work with new Supabase-based profile data
10. **`src/api/adminUsersService.ts`** -- Add partner-scoped user filtering
11. **`src/components/admin/reports/BookingReportsPage.tsx`** -- Pass partner cabin filter to sub-reports

## Implementation Order

1. Fix partner profile (vendorProfileService + VendorProfile component)
2. Restrict Room/Hostel management to view-only for partners
3. Hide Approve/Reject on reviews for partners
4. Hide Import Users and restrict sidebar items
5. Filter users list for partners
6. Fix booking reports for partners

