

## Fix Google OAuth 404 Error

### Root Cause
When clicking "Continue with Google", the OAuth flow redirects the user through the authentication process. After completing, the `redirect_uri` is set to `window.location.origin` (e.g., `https://inhalestaysbynaveen.lovable.app`), which lands on the homepage (`/`). The OAuth callback processing via `cloud-auth-js` may not complete properly because the homepage doesn't have authentication redirect logic.

Additionally, the `SocialLoginButtons` component doesn't properly handle the `redirected` state -- when `result.redirected` is `true`, the function continues execution and may show an error toast incorrectly.

### Fix (2 files)

**1. `src/components/auth/SocialLoginButtons.tsx`**
- Change `redirect_uri` from `window.location.origin` to `window.location.origin + '/student/login'` so the user returns to the login page after OAuth
- The login page already has the `useEffect` that detects an authenticated user and redirects to the dashboard
- Add a check for `result.redirected` to avoid showing error toast when the page is simply redirecting to Google

**2. `src/pages/StudentLogin.tsx`**
- Guard the redirect `useEffect` with `authChecked` to avoid premature redirects while auth state is still loading

### Technical Details

```typescript
// SocialLoginButtons.tsx - fixed redirect_uri and redirected check
const result = await lovable.auth.signInWithOAuth("google", {
  redirect_uri: window.location.origin + '/student/login',
});

if (result.redirected) return; // Page is navigating to Google, do nothing

if (result.error) {
  // show error toast
}
```

```typescript
// StudentLogin.tsx - guard with authChecked
const { login, user, authChecked } = useAuth();

useEffect(() => {
  if (authChecked && user) {
    navigate(redirectPath, { replace: true });
  }
}, [user, authChecked, redirectPath, navigate]);
```

### Expected Result
- Clicking "Continue with Google" redirects to Google consent screen
- After consent, user returns to `/student/login` where the session is picked up
- The `useEffect` detects the authenticated user and redirects to dashboard
- No more 404 error

