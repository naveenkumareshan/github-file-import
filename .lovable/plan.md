

# Attendance System Fixes & Student History

## Changes

### 1. Employee Permission Gating for Attendance

**File: `src/hooks/useVendorEmployeePermissions.ts`**
- Add `view_attendance` and `manage_attendance` permissions to `PartnerEmployeePermissions` interface and `ALL_PERMISSION_KEYS` array.

**File: `src/components/admin/AdminSidebar.tsx`**
- Change attendance sidebar items' `permissions` from `['seats_available_map']` / `['view_bed_map']` to `['view_attendance']`.

**File: `src/components/vendor/VendorEmployeeForm.tsx`** (or wherever permissions checkboxes are rendered)
- Add "Attendance" as a permission option under the relevant sections so partners can grant/deny access per employee.

### 2. Fix Attendance Page — Show Only Relevant Type

**File: `src/pages/admin/PropertyAttendance.tsx`**
- When `typeFilter` is `reading_room`, only show the "Total Present" and "Reading Room" summary cards (hide "Hostel" card). Vice versa for hostel.
- Only show the "Reading Room" or "Hostel" summary card when `typeFilter` is specific, alongside "Total Present". Show all 3 only when `typeFilter === 'all'`.
- Remove the "Type" column from the table when a specific type filter is active (it's redundant).

### 3. Student Attendance History Page

**New file: `src/pages/student/AttendanceHistory.tsx`**
- A simple page showing the student's own attendance records in a table/list: Date, Time, Property Name, Seat/Bed.
- Fetches from `property_attendance` where `student_id = auth.uid()` (already allowed by existing RLS).
- Date filter (defaults to current month).
- Styled consistent with student app pages.

**File: `src/pages/StudentDashboard.tsx`**
- Add an "Attendance History" button/link near the existing "Scan QR" button.

**File: `src/App.tsx`**
- Add route `/student/attendance-history` → `AttendanceHistory`.

### 4. RLS Review
- Existing RLS is correct: students read own, partners/employees read via `is_partner_or_employee_of`, admins read all. No changes needed to RLS policies.

### Summary of Files
- **Edit**: `useVendorEmployeePermissions.ts`, `AdminSidebar.tsx`, `PropertyAttendance.tsx`, `StudentDashboard.tsx`, `App.tsx`, employee form (permissions UI)
- **New**: `src/pages/student/AttendanceHistory.tsx`

