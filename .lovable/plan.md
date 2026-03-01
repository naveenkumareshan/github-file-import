
# Partner Onboarding Link and Unified Property Approvals

## Overview

Two main changes:
1. Add a partner onboarding/property registration flow -- partners can add new Reading Rooms or Hostels, which go into a "pending approval" state
2. Create a unified "Property Approvals" page under the Partners sidebar section (admin side) that shows both Reading Rooms and Hostels awaiting approval

---

## 1. Add `is_approved` to Cabins Table

Currently only `hostels` has an `is_approved` column. We need to add it to `cabins` as well so that new Reading Rooms created by partners also require approval.

**Database Migration:**
```sql
ALTER TABLE cabins ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false;
-- Auto-approve all existing cabins
UPDATE cabins SET is_approved = true WHERE is_approved = false;
```

Update RLS: The existing "Anyone can view active cabins" policy should also check `is_approved = true` for public visibility. Partners can still see their own unapproved cabins.

---

## 2. Partner Onboarding Link on Admin Partner Management Page

**Changes to `VendorApproval.tsx`:**
- Add a "Partner Onboarding Link" button in the header area that generates/copies a shareable link: `https://bookmynook.com/partner/register`
- This is the existing partner registration flow -- just make it visible and copyable from the admin page

---

## 3. Partner Profile -- "Add New Property" Option

**Changes to `VendorProfile.tsx` (Properties tab):**
- Add an "Add New Property" button in the Properties tab header
- Clicking it opens a dialog/form where the partner can choose property type (Reading Room or Hostel) and fill in basic details (name, location, gender for hostels, etc.)
- On submit, the property is created with `is_approved = false` and `is_active = false`
- Partner sees it in their Properties tab with a "Pending Approval" badge
- Once admin approves, it appears in Manage Properties

**Also add to `ManageProperties.tsx`:**
- Add a small "Add New Property" button at the top of the Manage Properties page for easy access

---

## 4. Unified Property Approvals Page (Admin Side)

**New page: `src/pages/admin/PropertyApprovals.tsx`**
- Replaces the current `HostelApprovals` page
- Shows BOTH Reading Rooms and Hostels pending approval in a single tabbed view
- Tabs: "All Pending", "Reading Rooms", "Hostels"
- Compact table with: S.No., Property ID, Name, Type (Reading Room/Hostel), Partner Name, Location, Submitted Date, Actions (Approve/Reject)
- On approval: sets `is_approved = true`, optionally sets commission for hostels
- On rejection: keeps `is_approved = false`, optionally sends reason
- Also shows "Approved Properties" section below with all approved properties

**Sidebar changes (`AdminSidebar.tsx`):**
- Remove "Approvals" from under Hostels sub-menu
- Add "Property Approvals" as a sub-item under "Partners" (or right below Partners in the admin sidebar)

**Route changes (`App.tsx`):**
- Replace `/admin/hostel-approvals` route with `/admin/property-approvals` pointing to new `PropertyApprovals` page
- Keep old route as redirect for backward compatibility

---

## 5. Service Layer Updates

**Changes to `adminCabinsService.ts`:**
- Add `approveCabin(cabinId, approved)` method
- Update `getAllCabins` to respect `is_approved` filter

**Changes to `hostelService.ts`:**
- Already has `approveHostel` -- no changes needed

---

## 6. Manage Properties Visibility

Properties only show in Manage Properties page after admin approval:
- Update `RoomManagement.tsx` to filter `is_approved = true` (or show unapproved ones with a "Pending" badge for the owner)
- Similarly for `HostelManagement.tsx`

---

## Files to Create/Modify

### New Files:
- `src/pages/admin/PropertyApprovals.tsx` -- Unified approval page for both property types
- Database migration -- Add `is_approved` to cabins

### Modified Files:
- `src/components/admin/VendorApproval.tsx` -- Add onboarding link button
- `src/components/vendor/VendorProfile.tsx` -- Add "Add New Property" button and form in Properties tab
- `src/pages/partner/ManageProperties.tsx` -- Add "Add New Property" button
- `src/components/admin/AdminSidebar.tsx` -- Move approvals under Partners, remove from Hostels
- `src/App.tsx` -- Add property-approvals route, update hostel-approvals
- `src/api/adminCabinsService.ts` -- Add approveCabin method, is_approved filter
- `src/pages/RoomManagement.tsx` -- Show approval status for partner's unapproved rooms

## Implementation Order

1. Database migration (add `is_approved` to cabins)
2. Create PropertyApprovals page
3. Update sidebar and routes
4. Add onboarding link to VendorApproval
5. Add "Add New Property" to partner profile and manage properties
6. Update room/hostel management to respect approval status
