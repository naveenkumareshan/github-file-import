

## Implementation Plan: Fix Login, Add Partner Portal Button, Full Internal Rename

### 1. Fix Login Issues (Database + Auth)

**Database Migration** -- Update the `handle_new_user` trigger to auto-insert a default `student` role into `user_roles`:

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

**Also create the trigger** if it doesn't exist:
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**AuthContext.tsx fixes:**
- Add a login wait mechanism: after `signInWithPassword` succeeds, wait for the `onAuthStateChange` callback to populate the user state before returning success
- Add null safety guard so `user.role` access never crashes on null user
- Better error message for email not confirmed

**AdminDashboard.tsx fix:**
- Line 78: Change `user.role === 'admin'` to `user?.role === 'admin'` (null safety)
- Line 88: Same null safety fix

---

### 2. Add "Partner Portal" Button to Admin Dashboard

**File: `src/pages/AdminDashboard.tsx`**
- Add an `ExternalLink` icon import
- Add a "Partner Portal" button next to "Reports" (only visible when `user?.role === 'admin'`)
- Opens `/partner/login` in a new tab

---

### 3. Full Internal Rename: vendor/host to partner

This renames all internal variable names, component names, type names, service names, and hook names. File paths on disk stay the same to avoid breaking imports. Database role values (`vendor`, `vendor_employee`) stay unchanged.

#### Phase A: Routes (App.tsx)
- Add `/partner/login` and `/partner/register` routes pointing to the same components
- Keep `/vendor/login`, `/vendor/register`, `/host/login`, `/host/register` as aliases for backward compatibility
- Rename lazy import variable names: `VendorLogin` to `PartnerLogin`, `VendorRegister` to `PartnerRegister`, etc.

#### Phase B: Type Definitions (`src/types/vendor.ts`)
- `VendorEmployee` renamed to `PartnerEmployee` (add `export type VendorEmployee = PartnerEmployee` for backward compat)
- `VendorBooking` renamed to `PartnerBooking` (add `export type VendorBooking = PartnerBooking` for backward compat)

#### Phase C: Hook Rename (`src/hooks/useVendorEmployeePermissions.ts`)
- Rename `VendorEmployeePermissions` to `PartnerEmployeePermissions`
- Rename `useVendorEmployeePermissions` to `usePartnerEmployeePermissions`
- Add backward-compatible re-export: `export const useVendorEmployeePermissions = usePartnerEmployeePermissions`
- Update all 4 consuming files to use new name

#### Phase D: API Services (keep file paths, rename exports)
Files affected (rename exported object/type names):
- `src/api/vendorService.ts`: `vendorService` stays as-is (too many consumers), just add `export const partnerService = vendorService`
- `src/api/vendorSeatsService.ts`: Add `export const partnerSeatsService = vendorSeatsService`
- `src/api/vendorRegistrationService.ts`: Add `export const partnerRegistrationService = vendorRegistrationService`
- `src/api/vendorProfileService.ts`: Add `export const partnerProfileService = vendorProfileService`
- `src/api/vendorApprovalService.ts`: Add `export const partnerApprovalService = vendorApprovalService`
- `src/api/vendorDocumentService.ts`: Add `export const partnerDocumentService = vendorDocumentService`
- `src/api/adminVendorService.ts`: Add `export const adminPartnerService = adminVendorService`
- `src/api/adminVendorDocumentService.ts`: Add `export const adminPartnerDocumentService = adminVendorDocumentService`

#### Phase E: Component Internal Renames
These files get their exported component/function names updated, plus any remaining "Host" or "Vendor" UI text changed to "Partner":

| File | Component Rename |
|---|---|
| `src/pages/vendor/VendorLogin.tsx` | `VendorLogin` to `PartnerLogin`, update `/host/register` link to `/partner/register`, `/host/login` to `/partner/login` |
| `src/pages/vendor/VendorRegister.tsx` | `VendorRegister` to `PartnerRegister`, update `/host/login` links to `/partner/login` |
| `src/pages/vendor/VendorDashboard.tsx` | `VendorDashboard` to `PartnerDashboard` |
| `src/pages/vendor/VendorProfile.tsx` | `VendorProfilePage` to `PartnerProfilePage` |
| `src/pages/vendor/VendorEmployees.tsx` | `VendorEmployees` to `PartnerEmployees`, update `VendorEmployee` type imports |
| `src/pages/vendor/VendorSeats.tsx` | `VendorSeats` to `PartnerSeats`, remove leftover `handleToggleHotSelling` reference, update imports |
| `src/pages/HostDashboard.tsx` | `HostDashboard` to `PartnerDashboard` |
| `src/components/vendor/VendorProfile.tsx` | `VendorProfile` to `PartnerProfile` |
| `src/components/vendor/VendorPayouts.tsx` | Keep named export as-is (too many references) |
| `src/components/vendor/VendorDocumentUpload.tsx` | `VendorDocumentUpload` to `PartnerDocumentUpload` |
| `src/components/vendor/VendorEmployeeForm.tsx` | `VendorEmployeeForm` to `PartnerEmployeeForm` |
| `src/components/admin/VendorApproval.tsx` | Already renamed UI text; internal component stays |
| `src/components/admin/VendorDetailsDialog.tsx` | Already renamed UI text |
| `src/components/admin/VendorStatsCards.tsx` | Already renamed UI text |
| `src/components/admin/VendorAutoPayoutSettings.tsx` | Internal rename |

#### Phase F: AdminSidebar + AdminLayout
- Already mostly done in previous changes
- Update any remaining "Host" or "Vendor" display text to "Partner"

#### Phase G: Remaining consumer file updates
- `src/components/admin/CouponManagement.tsx` -- update vendor references
- `src/components/admin/SeatTransferManagement.tsx` -- update type imports
- `src/components/admin/NotificationManagement.tsx` -- update service imports
- `src/components/vendor/AutoPayoutSettings.tsx` -- update service imports
- `src/components/vendor/InstantSettlementDialog.tsx` -- update service imports
- `src/pages/RoomManagement.tsx` -- update service imports

### Important Constraints

- Database `app_role` enum values `vendor` and `vendor_employee` are NOT changed (would break auth and RLS)
- File/folder paths on disk stay the same (renaming folders breaks imports)
- Backward-compatible type/export aliases are added so nothing breaks during transition
- All role checks in code continue using `'vendor'` and `'vendor_employee'` strings

### Estimated Scope
- 1 database migration
- ~35 frontend files edited
- No breaking changes to API endpoints or database schema

