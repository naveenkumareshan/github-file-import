

## Why the Site "Doesn't Work at Night"

### Root Cause

The issue is in `AuthContext.tsx` — the auth initialization flow has a critical gap that causes the app to get stuck on "Loading..." forever when the session token expires (typically after hours of inactivity, e.g., overnight):

```text
Flow when user opens the app with an expired session:

1. onAuthStateChange listener is set up
2. getSession() is called → finds session in localStorage (expired tokens)
3. Since session exists, getSession() does NOT set isLoading=false (line 147-150)
4. It relies on onAuthStateChange to resolve loading state
5. Supabase tries to refresh the token automatically
6. If refresh fails (expired refresh token, network issue at night), 
   onAuthStateChange may not fire reliably in all edge cases
7. isLoading stays TRUE forever → ProtectedRoute shows "Loading..." forever
8. The app appears completely broken / "not working"
```

Partners and employees who close the app at night and reopen it hit this exact scenario — their access token expired, refresh fails silently, and the app hangs.

### Fix

**File: `src/contexts/AuthContext.tsx`**

1. Add a **safety timeout** (8 seconds) — if auth state hasn't resolved by then, force-check the session and resolve loading state
2. Make `getSession()` also handle the case where a session exists but might be expired — call `setIsLoading(false)` after a delay regardless
3. Handle the `SIGNED_OUT` event from token refresh failure explicitly

```typescript
// In the useEffect, after setting up onAuthStateChange and getSession:

// Safety timeout: if auth hasn't resolved in 8s, force resolve
const safetyTimer = setTimeout(async () => {
  if (isMounted && isLoading) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setUser(null);
    }
    setIsLoading(false);
    setAuthChecked(true);
  }
}, 8000);

// Clean up
return () => { 
  isMounted = false; 
  subscription.unsubscribe(); 
  clearTimeout(safetyTimer);
};
```

Also update the `getSession()` call to set loading false regardless:

```typescript
supabase.auth.getSession().then(async ({ data: { session } }) => {
  if (!isMounted) return;
  if (!session) {
    setIsLoading(false);
    setAuthChecked(true);
  }
  // If session exists but no onAuthStateChange fires within 5s, force resolve
});
```

**File: `src/components/ProtectedRoute.tsx`**

Add a loading timeout so users see a retry option instead of infinite "Loading...":

```typescript
// If isLoading has been true for >10 seconds, show a retry button
// instead of infinite "Loading..."
```

### Files to Modify

| File | Change |
|------|--------|
| `src/contexts/AuthContext.tsx` | Add safety timeout to force-resolve auth state; better error handling |
| `src/components/ProtectedRoute.tsx` | Add loading timeout with retry/re-login option instead of infinite spinner |

### What Users Will See After Fix
- If session is valid: app loads normally (no change)
- If session expired but refresh works: app loads normally after brief delay (no change)
- If session expired and refresh fails: **instead of infinite "Loading..."**, users are redirected to the login page within 8 seconds, or shown a "Session expired, please log in again" message with a button

