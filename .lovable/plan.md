

# Fix: View Details Navigation & Employee Login

## Issue 1: View Details Button Not Working for Partners

**Root Cause**: Both `AdminBookings.tsx` and `AdminBookingsList.tsx` hardcode the navigation path as `/admin/bookings/...`. When a partner (on `/partner/bookings`) clicks View Details, they get navigated to `/admin/bookings/...` which is a different route tree. While the route technically exists and allows vendor roles, the layout context changes, causing potential issues.

The same page `AdminBookings.tsx` has **two hardcoded navigate calls** (lines 125 and 220) and `AdminBookingsList.tsx` has one (line 308) — all using `/admin/bookings/...`.

**Fix**: Detect the current route prefix (`/admin` vs `/partner`) using `useLocation()` and use it dynamically in all three navigation calls.

### Files to modify:
- `src/pages/AdminBookings.tsx` — Add `useLocation`, derive route prefix, fix 2 navigate calls
- `src/components/admin/AdminBookingsList.tsx` — Add `useLocation`, derive route prefix, fix 1 navigate call

## Issue 2: Employee Login Failing ("Invalid Login")

**Root Cause**: The `partner-create-employee` edge function was just created in the previous iteration. Employees created **before** this change have records in `vendor_employees` but **no auth account** in Supabase Auth — so they literally cannot log in.

The edge function itself looks correct for **new** employees. The issue is with **existing** employees who were created without auth accounts.

**Fix**: Two-part solution:
1. For the existing employee (accounts@issmedu.in with user_id 5547c045-...), verify they have an auth account. If not, the partner needs to re-create them or we need a migration approach.
2. Add a "Reset Password" capability in the employee management UI so partners can fix credentials for existing employees. 

Actually, the simpler fix: the existing vendor_employee user (5547c045) already has user_roles entry and a profile — meaning they DO have an auth account. The login failure is likely a **password issue** (the user may not know the correct password since it was set programmatically).

**Practical Fix**: Add a "Reset Password" button in the partner employee list that calls the existing `admin-reset-password` edge function, allowing partners to set a new password for their employees.

### Files to modify:
- `src/pages/vendor/VendorEmployees.tsx` — Add Reset Password dialog/action for employees with `employee_user_id`
- `supabase/functions/admin-reset-password/index.ts` — Verify it allows vendor callers (not just admins), or create a `partner-reset-employee-password` function

### Summary of changes:

| File | Change |
|------|--------|
| `src/pages/AdminBookings.tsx` | Use dynamic route prefix for View Details navigation |
| `src/components/admin/AdminBookingsList.tsx` | Use dynamic route prefix for View Details navigation |
| `src/pages/vendor/VendorEmployees.tsx` | Add Reset Password action for employees |
| `supabase/functions/admin-reset-password/index.ts` | Verify/extend to allow vendor callers |

