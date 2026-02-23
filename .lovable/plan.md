

## Plan: Internal Rename, Fix Login, and Add Partner Login to Admin Dashboard

### 1. Fix Login Issues (Critical - Do First)

**Root Cause:** Two problems found:

**A) No role auto-created on registration**
The `handle_new_user` database trigger creates a `profiles` row but does NOT insert into `user_roles`. After registration, `fetchUserRole()` returns `'student'` by default (which works), but could cause issues if RLS policies depend on a row existing.

**Fix:** Update the `handle_new_user` trigger to also insert a default `'student'` role into `user_roles`.

**B) Email confirmation may block login**
After registration, the app says "You can now log in" but if email confirmation is required, login fails silently. The auth context then leaves the user in a broken state, causing blank pages.

**Fix:**
- Update `AuthContext.tsx` to handle the timing issue: ensure the login function waits for the auth state to fully resolve before returning success
- Add proper error messaging when email is not confirmed
- Add a guard in `AdminDashboard.tsx` line 78 where `user.role` is accessed without null safety (`user.role === 'admin'` when `user` could still be null)

**Database migration:**
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.email)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;
```

---

### 2. Add "Login as Partner" to Admin Dashboard

Add a button in the Admin Dashboard header area that opens the Partner login page (`/vendor/login`) in a new tab, or navigates to it directly.

**File:** `src/pages/AdminDashboard.tsx`
- Add a "Partner Portal" button next to the existing "Reports" button
- Only visible to admin role users
- Opens `/partner/login` (or `/vendor/login`) in a new tab

---

### 3. Full Internal Rename: vendor/host to partner

This is a large-scale rename across the entire frontend codebase. It will be done in phases:

**Phase A - Route paths and App.tsx:**
- `/vendor/login` -> `/partner/login` (keep `/vendor/login` as redirect for backwards compat)
- `/host/login` -> `/partner/login`
- `/host/register` -> `/partner/register`
- Update all `Link` references to use `/partner/` paths
- Update `AdminLayout.tsx` route labels

**Phase B - Page and component file renames (import paths):**
- `src/pages/vendor/VendorLogin.tsx` -> rename exports/component names to `PartnerLogin`
- `src/pages/vendor/VendorRegister.tsx` -> `PartnerRegister`
- `src/pages/vendor/VendorDashboard.tsx` -> `PartnerDashboard`
- `src/pages/vendor/VendorProfile.tsx` -> `PartnerProfile`
- `src/pages/vendor/VendorEmployees.tsx` -> `PartnerEmployees`
- `src/pages/vendor/VendorSeats.tsx` -> `PartnerSeats`
- `src/components/vendor/VendorProfile.tsx` -> `PartnerProfile`
- `src/components/vendor/VendorPayouts.tsx` -> `PartnerPayouts`
- `src/components/vendor/VendorDocumentUpload.tsx` -> `PartnerDocumentUpload`
- `src/components/vendor/VendorEmployeeForm.tsx` -> `PartnerEmployeeForm`
- `src/components/admin/VendorApproval.tsx` -> `PartnerApproval`
- `src/components/admin/VendorDetailsDialog.tsx` -> `PartnerDetailsDialog`
- `src/components/admin/VendorStatsCards.tsx` -> `PartnerStatsCards`
- `src/components/admin/VendorAutoPayoutSettings.tsx` -> `PartnerAutoPayoutSettings`
- `src/pages/HostDashboard.tsx` -> `PartnerDashboard`

Note: File paths on disk will stay the same (renaming folders breaks too many things). Only the exported component names and all internal variable/type references will change.

**Phase C - Type definitions:**
- `src/types/vendor.ts` -> rename types: `VendorEmployee` -> `PartnerEmployee`, `VendorBooking` -> `PartnerBooking`
- Update all imports referencing these types

**Phase D - API services:**
- Rename exported objects/functions in:
  - `vendorService.ts`, `vendorProfileService.ts`, `vendorRegistrationService.ts`
  - `vendorDocumentService.ts`, `vendorSeatsService.ts`
  - `adminVendorService.ts`, `adminVendorDocumentService.ts`
  - `vendorApprovalService.ts`
- Update all consuming files

**Phase E - Hooks:**
- `useVendorEmployeePermissions.ts` -> rename hook to `usePartnerEmployeePermissions`
- Update all imports

**Phase F - AuthContext and ProtectedRoute:**
- Keep `'vendor'` and `'vendor_employee'` as internal role enum values (these match the database `app_role` enum and MUST NOT change)
- Update display labels only (already done in previous changes)

**Phase G - AdminSidebar and AdminLayout:**
- Update any remaining internal references

### Important Constraints

- The database `app_role` enum values (`vendor`, `vendor_employee`) will NOT change -- this would break authentication and RLS policies
- Backend files (in `backend/`) are Express/Node.js and cannot run in Lovable -- renaming them is cosmetic only
- The rename is UI/frontend code only; all Supabase role checks continue using `'vendor'` internally

### Estimated Scope
- ~30-40 files will be edited
- Login fix requires 1 database migration + 2 file edits
- Partner login button requires 1 file edit

