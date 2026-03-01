
# Partner Management Overhaul and Sidebar Reordering

## 1. Rebuild Partner Management Page (Admin Side) -- Receipts-style UI

**Current**: `VendorApproval.tsx` uses a `DataTable` component with large text and basic pagination. No option to re-activate a suspended/rejected partner.

**Changes to `src/components/admin/VendorApproval.tsx`**:
- Replace `DataTable` with a standard `Table` (same pattern as `Receipts.tsx`): compact `text-[11px]` rows, `h-8` filter inputs, S.No. column with `AdminTablePagination`
- Add compact single-line filter row (status, business type, search) instead of collapsible filter card
- Add "Activate" button in Actions column for suspended partners (calls `handleStatusUpdate(id, 'approve')`)
- Add "Documents" tab to `VendorDetailsDialog.tsx` that lists files from `partner-documents` storage bucket for the partner's `user_id`, with per-item approve/reject toggles
- Add mobile card view using `useIsMobile` hook

**Changes to `src/components/admin/VendorDetailsDialog.tsx`**:
- Add a "Documents" tab alongside Basic/Business/Bank/Actions
- Fetch documents from `supabase.storage.from('partner-documents').list(vendor.user_id)`
- Each document shows a preview link and an "Approve" / "Reject" toggle
- Add a "Properties" section showing cabins/hostels linked to this partner (query `cabins` and `hostels` tables where `created_by = vendor.user_id`)
- Show re-activate option for rejected partners (same as suspended -- already exists for suspended)

**Changes to `src/api/vendorApprovalService.ts`**:
- Add `reactivateVendor` method (updates status back to 'approved')
- Already has `updateVendorStatus` which handles approve/suspend/reject -- just need to expose "activate" from rejected state too

**Suspension behavior**:
- When a partner is suspended, set `is_active = false` on their `partners` record AND set `is_booking_active = false` on all their cabins/hostels
- When partner logs in and status is 'suspended', redirect to a "Contact Admin" page instead of the dashboard
- Add a check in `AuthContext` or `ProtectedRoute`: if partner's status is suspended, show a blocked message

**Database migration**: Add a trigger or use the service layer to cascade suspension to properties (set `is_booking_active = false` on cabins where `created_by = suspended_partner.user_id`)

## 2. Admin Document Review for Partners

**New fields needed**: Add a `document_approvals` jsonb column to `partners` table to track per-section approval status (e.g., `{ basic_info: 'approved', business_details: 'pending', bank_details: 'approved', documents: 'rejected' }`)

**Database migration**:
```sql
ALTER TABLE partners ADD COLUMN IF NOT EXISTS document_approvals jsonb DEFAULT '{}';
```

**Admin behavior**: In `VendorDetailsDialog`, each tab (Basic Info, Business, Bank, Documents) gets an "Approve" / "Reject" button. Once approved, that section becomes read-only for the partner.

**Partner behavior**: In `VendorProfile.tsx`, check `document_approvals` -- if a section is approved, hide the Edit button for that section. Show a green "Approved" badge. If rejected, show red "Rejected" badge with reason.

## 3. Partner Profile -- Show Linked Properties

**Changes to `src/components/vendor/VendorProfile.tsx`**:
- Add a new "Properties" tab
- Fetch cabins from `supabase.from('cabins').select('id, name, total_seats, is_active').eq('created_by', user.id)`
- Fetch hostels from `supabase.from('hostels').select('id, name, total_beds, is_active').eq('created_by', user.id)`
- Display a simple list: Property Name, Type (Reading Room/Hostel), Capacity (seats/beds), Status

## 4. Employee Form -- Show ALL Sidebar Menu Options

**Current**: `VendorEmployeeForm.tsx` shows 10 modules. Missing: Hostels, Bed Map, Hostel Bookings, Hostel Receipts, Hostel Deposits, Due Management, Hostel Due Management, Operations, Coupons, Key Deposits, Manage Properties

**Changes to `src/components/vendor/VendorEmployeeForm.tsx`**:
- Expand `PERMISSION_MODULES` to include ALL sidebar items that a partner has access to:
  - Dashboard, Operations
  - Seat Map, Due Management, Bookings, Receipts, Key Deposits (Reading Rooms group)
  - Bed Map, Hostel Due Management, Hostel Bookings, Hostel Receipts, Hostel Deposits (Hostels group)
  - Manage Properties, Reviews
  - Users/Students, Coupons
  - Employees, Reports, Payouts, Complaints
- Group them visually with section headers in the table

**Changes to `src/hooks/useVendorEmployeePermissions.ts`**: Ensure all new permission keys are recognized and checked properly in the sidebar

**Changes to `src/components/admin/AdminSidebar.tsx`**: Ensure every sidebar item checks its corresponding permission key for `vendor_employee` role

## 5. Move Hostels Above Users in Sidebar (Both Admin and Partner)

**Current order**: Dashboard > Operations > Reading Rooms > **Users** > **Hostels** > ...

**New order**: Dashboard > Operations > Reading Rooms > **Hostels** > **Users** > ...

**Changes to `src/components/admin/AdminSidebar.tsx`**:
- Move the Hostels block (lines 202-272) ABOVE the Users block (lines 183-200)
- This is a pure reorder -- no logic changes

---

## Files to Modify

1. `src/components/admin/VendorApproval.tsx` -- Rebuild with Receipts-style compact table, add activate button
2. `src/components/admin/VendorDetailsDialog.tsx` -- Add Documents tab, Properties section, activate from rejected
3. `src/api/vendorApprovalService.ts` -- Add property cascade on suspension
4. `src/components/vendor/VendorProfile.tsx` -- Add Properties tab, section-level approval display, lock approved sections
5. `src/api/vendorProfileService.ts` -- Add method to fetch linked properties
6. `src/components/vendor/VendorEmployeeForm.tsx` -- Expand to ALL sidebar permission modules with grouped sections
7. `src/components/admin/AdminSidebar.tsx` -- Reorder Hostels above Users
8. Database migration -- Add `document_approvals` column to `partners`

## Implementation Order

1. Database migration (add `document_approvals` column)
2. Reorder sidebar (Hostels above Users) -- quick win
3. Expand employee permission modules
4. Rebuild Partner Management page (admin)
5. Add Documents tab and Properties to VendorDetailsDialog
6. Update Partner Profile with Properties tab and section locking
7. Add suspension cascade logic
