

# Fix: Partner Pages Not Opening

## Root Cause

The `VendorLogin.tsx` redirects partners to `/admin/dashboard` (lines 27 and 81) instead of `/partner/dashboard`. Meanwhile, the sidebar generates all links with the `/partner/` prefix. This creates a critical mismatch:

1. Partner logs in → lands on `/admin/dashboard` (under the `/admin` route tree)
2. Sidebar shows `/partner/*` links (because `isPartner = true`)
3. Clicking ANY sidebar link causes a **full route tree switch** from `/admin` to `/partner`
4. React Router unmounts the entire `/admin` tree and remounts a new `/partner` tree
5. During this remount, `ProtectedRoute` and `AdminSidebar` re-initialize their hooks (`useAuth`, `useVendorEmployeePermissions`, `usePartnerPropertyTypes`) — all start with `loading: true`
6. This causes a blank flash or stuck loading state on every single click

After the first click lands the partner in `/partner/*`, subsequent clicks should stay in the same tree. But if the user navigates back to dashboard or refreshes, they end up on `/admin/dashboard` again, restarting the cycle.

## Fix

### File: `src/pages/vendor/VendorLogin.tsx`
- **Line 27**: Change redirect from `/admin/dashboard` to `/partner/dashboard`
- **Line 81**: Change post-login navigation from `/admin/dashboard` to `/partner/dashboard`

### File: `src/contexts/AuthContext.tsx` (no change needed)
Auth context is fine — `isLoading` stays `false` after initial auth check. The issue is purely the route mismatch causing full tree remounts.

### File: `src/pages/Index.tsx` (verify)
Check if the homepage redirect for authenticated vendors also sends them to `/admin/dashboard` instead of `/partner/dashboard`. If so, fix it too.

## Summary
Two-line fix in `VendorLogin.tsx` to redirect partners to `/partner/dashboard` instead of `/admin/dashboard`, keeping all navigation within the correct route tree and preventing full layout remounts.

