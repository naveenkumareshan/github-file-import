

# Fix Google OAuth Login Not Redirecting After Account Selection

## Problem
After a user selects their Google account, they are returned to the login page instead of being redirected to the dashboard. This happens because:

1. In `SocialLoginButtons.tsx`, the success case after OAuth is not handled -- `onLoginSuccess` is never called
2. The component relies entirely on `onAuthStateChange` to propagate the session, but there is a timing gap
3. For users accessing the app directly (not in preview), the page-redirect flow returns to the login page without explicit session re-detection

## Fix

### 1. Handle OAuth success explicitly in `SocialLoginButtons.tsx`
After the `result.error` check, add a success handler that calls `onLoginSuccess`:

```typescript
if (result.redirected) return;

if (result.error) {
  // ... existing error handling ...
}

// OAuth succeeded -- session was set by lovable module
onLoginSuccess?.({ success: true });
```

### 2. Add session re-check on login page mount in `StudentLogin.tsx`
When the login page loads (e.g., after an OAuth redirect in production mode), explicitly check for an existing session and redirect if found. This covers the redirect flow where the page navigates away and returns:

```typescript
useEffect(() => {
  // Handle OAuth redirect return -- check if session exists on mount
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      navigate(redirectPath, { replace: true });
    }
  });
}, []);
```

### Files to modify

| File | Change |
|------|--------|
| `src/components/auth/SocialLoginButtons.tsx` | Add explicit success handling after OAuth completes (call `onLoginSuccess`) |
| `src/pages/StudentLogin.tsx` | Add `useEffect` to check for existing session on mount (covers redirect flow) |

### Why this works
- **Popup flow (preview)**: After `setSession` succeeds, `onLoginSuccess` is called immediately, which triggers `navigate(redirectPath)` in `StudentLogin`
- **Redirect flow (production)**: When the page reloads after OAuth redirect, the session check on mount detects the active session and redirects to dashboard
- **Returning users**: If a user navigates to `/student/login` while already logged in, they are immediately redirected

