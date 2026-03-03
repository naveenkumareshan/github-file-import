
# Partner Login Link, Password Reset from Admin, and Routing Fixes

## Issues Identified

1. **No Partner Login Link** in admin Partner Management -- only the "Onboarding Link" (register) exists. Need a copyable "Login Link" button too.

2. **No password reset for partners from admin side** -- The VendorDetailsDialog "Actions" tab has approve/reject/suspend but no "Reset Password" button. Need to add the same `AdminResetPasswordDialog` already used in User Management.

3. **Partner login redirects to `/admin/dashboard` but route falls inside student MobileAppLayout** -- The VendorLogin page (line 81) navigates to `/admin/dashboard` which is correct, but the "Forgot password?" link points to `/student/forgot-password` (line 176), which is wrong for partners.

4. **Old student pages showing when `inhalestays.com` is visited by a logged-in partner** -- The `"/"` route renders `Index.tsx` which shows `AuthenticatedHome` (student view) when user role is `student`, but for vendors it shows `GuestHome`. When a partner visits `/`, they see the public marketing page instead of being redirected to their dashboard.

## Plan

### 1. Add "Partner Login Link" button to VendorApproval.tsx

In `src/components/admin/VendorApproval.tsx`, add a second copy-link button next to the existing "Onboarding Link" button:

- New button: "Login Link" that copies `https://inhalestays.com/partner/login` to clipboard
- Place it right next to the existing "Onboarding Link" button (line 141-151)

### 2. Add "Reset Password" to VendorDetailsDialog Actions tab

In `src/components/admin/VendorDetailsDialog.tsx`:

- Import `AdminResetPasswordDialog` from `./AdminResetPasswordDialog`
- Add a "Reset Password" button in the "Actions" tab (after the existing approve/reject/suspend sections, around line 448)
- The button will open the `AdminResetPasswordDialog` with the partner's `user_id`, `contact_person` (name), and `email`
- This uses the existing `admin-reset-password` edge function -- no backend changes needed

### 3. Fix VendorLogin "Forgot password?" link

In `src/pages/vendor/VendorLogin.tsx`:

- Change the "Forgot password?" link from `/student/forgot-password` to `/partner/forgot-password` (line 176)
- Add a new route `/partner/forgot-password` in `App.tsx` pointing to the same `ForgotPassword` component

### 4. Fix partner redirect when visiting "/"

In `src/pages/Index.tsx`:

- Update the root `Index` component to redirect partners (vendor, vendor_employee, admin) to `/partner/dashboard` or `/admin/dashboard` instead of showing the student home or guest marketing page
- Add check: if authenticated and role is `vendor`/`vendor_employee`, redirect to `/partner/dashboard`; if `admin`/`super_admin`, redirect to `/admin/dashboard`

## Files to Modify

| File | Change |
|------|--------|
| `src/components/admin/VendorApproval.tsx` | Add "Login Link" copy button |
| `src/components/admin/VendorDetailsDialog.tsx` | Add Reset Password button + dialog in Actions tab |
| `src/pages/vendor/VendorLogin.tsx` | Fix forgot-password link to `/partner/forgot-password` |
| `src/App.tsx` | Add `/partner/forgot-password` route |
| `src/pages/Index.tsx` | Redirect admin/vendor roles to their dashboards instead of showing student/guest pages |

## Technical Details

**Reset Password in VendorDetailsDialog**: Will reuse the existing `AdminResetPasswordDialog` component which calls the `admin-reset-password` edge function. The dialog needs `userId` (the partner's `user_id` from the vendor record), `userName`, and `userEmail`.

**Routing fix for Index.tsx**:
```text
if authenticated:
  - student -> show AuthenticatedHome (existing)
  - vendor/vendor_employee -> Navigate to /partner/dashboard
  - admin/super_admin -> Navigate to /admin/dashboard
else:
  - show GuestHome (existing)
```
