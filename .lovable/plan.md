

## Auth System Audit and Fixes

After reviewing all login portals, Google OAuth, forgot/reset password, and signup flows, here are the issues found and the plan to fix them:

---

### Issues Found

| # | Issue | Severity | Where |
|---|-------|----------|-------|
| 1 | **Google OAuth uses legacy Express backend** | Critical | `SocialLoginButtons.tsx` opens a popup to `/api/auth/google` (old Express server). The backend has been migrated to Supabase, so this flow is completely broken. | 
| 2 | **Forgot Password uses legacy Express backend** | Critical | `ForgotPassword.tsx` calls `passwordResetService.requestPasswordReset()` which hits `/auth/forgot-password` on the old Express API via axios. |
| 3 | **Reset Password uses legacy Express backend** | Critical | `ResetPassword.tsx` uses token-based validation via the old API. Should use Supabase's recovery flow (`supabase.auth.updateUser`). |
| 4 | **Partner "Forgot Password" link goes to 404** | Medium | `VendorLogin.tsx` line 176 links to `/forgot-password` which has no route. Should be `/student/forgot-password` or a shared route. |
| 5 | **Registration success message is misleading** | Low | Says "You can now log in" but email confirmation is required (auto-confirm is NOT enabled). Should tell user to check their email. |

---

### Fix Plan

#### 1. Fix Google OAuth -- use Lovable Cloud managed OAuth

- Use the Configure Social Login tool to set up Google OAuth via Lovable Cloud
- Replace `SocialLoginButtons.tsx` entirely to use `lovable.auth.signInWithOAuth("google")` instead of the legacy popup flow
- Remove dependency on `getImageUrl` for auth URLs and the `authService` social login methods
- The `SocialLogin` function in `AuthContext.tsx` becomes unnecessary (Supabase `onAuthStateChange` handles the session automatically after OAuth redirect)

#### 2. Fix Forgot Password -- use Supabase auth

- Rewrite `ForgotPassword.tsx` to call `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`
- Remove dependency on `passwordResetService.ts`

#### 3. Fix Reset Password -- use Supabase recovery flow

- Create a new `/reset-password` route (public, not behind auth)
- Rewrite `ResetPassword.tsx` to:
  - Check for `type=recovery` in URL hash (Supabase's callback pattern)
  - Call `supabase.auth.updateUser({ password: newPassword })` to set the new password
  - Remove the token-based validation logic
- Update the route in `App.tsx` from `/student/reset-password/:token` to `/reset-password` (Supabase redirects here directly)
- Keep `/student/forgot-password` route pointing to the updated ForgotPassword page

#### 4. Fix Partner "Forgot Password" link

- Update `VendorLogin.tsx` to link to `/student/forgot-password` (shared forgot password page)

#### 5. Fix Registration success message

- Update `StudentRegister.tsx` to show "Please check your email to verify your account before logging in" instead of "You can now log in"

---

### Files Changed

| File | Action |
|------|--------|
| `src/components/auth/SocialLoginButtons.tsx` | Rewrite to use Lovable Cloud OAuth |
| `src/pages/ForgotPassword.tsx` | Use `supabase.auth.resetPasswordForEmail` |
| `src/pages/ResetPassword.tsx` | Use Supabase recovery flow |
| `src/App.tsx` | Add `/reset-password` route, keep legacy route |
| `src/pages/vendor/VendorLogin.tsx` | Fix forgot password link |
| `src/pages/StudentRegister.tsx` | Fix success message |
| `src/contexts/AuthContext.tsx` | Clean up unused `SocialLogin` method |

