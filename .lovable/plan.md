

## Plan: Fix PIN Display & Make PIN Universal + Employee Permission Control

### Issues Found

1. **PIN not showing** — The `hmac()` function is missing because the `pgcrypto` extension isn't enabled. Console error: `function hmac(text, text, unknown) does not exist`
2. **PIN should be universal** — Currently generates per-property PINs. User wants ONE PIN across all partner properties so any student at any of the partner's properties can use the same PIN.
3. **Employee permission control** — Employees should only see/generate PIN if they have `manage_attendance` permission, and only for their `allowed_properties`.

### Implementation

**1. SQL Migration — Enable pgcrypto + Redesign PIN to be per-owner**

- Enable `pgcrypto` extension: `CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;`
- Change `attendance_pins` table: replace `property_id + property_type` unique key with `owner_id` (the partner's user ID). One secret per partner = one PIN for all their properties.
- Update `generate_attendance_pin` RPC: accept `p_owner_id uuid` instead of property params. Generate/return PIN based on the owner's single secret.
- Update `mark_pin_attendance` RPC: accept just `p_pin text`. Look up the student's active booking across ALL properties, find the property owner, validate PIN against that owner's secret. Skip due check as before.
- Update `mark_qr_attendance` RPC references to use `extensions.hmac(...)` instead of bare `hmac(...)`.

**2. Update `AttendancePinDisplay.tsx`**

- Remove property selector — PIN is universal for all partner properties.
- Call a simplified `getAttendancePin(ownerId)` instead of per-property.
- For employees: check `hasPermission('manage_attendance')` — hide component if not permitted. Also filter display based on `allowed_properties` (show PIN only if employee has at least one allowed property).
- Show all property names the PIN covers as a subtitle.

**3. Update `attendanceService.ts`**

- Change `getAttendancePin` to accept `ownerId` instead of `propertyId + propertyType`.
- Change `markPinAttendance` to accept just `pin` (no property params needed — RPC auto-detects from student's bookings).

**4. Update `ScanAttendance.tsx`**

- When `needs_pin` is returned, the PIN entry just sends the pin — no need for property_id/type since the RPC resolves it from the student's active booking.

### Files to modify
- **SQL migration**: Enable pgcrypto, alter `attendance_pins`, rewrite `generate_attendance_pin` and `mark_pin_attendance` RPCs
- **`src/api/attendanceService.ts`**: Simplify PIN method signatures
- **`src/components/admin/AttendancePinDisplay.tsx`**: Remove property selector, add permission check, show universal PIN
- **`src/pages/student/ScanAttendance.tsx`**: Simplify PIN submission call

