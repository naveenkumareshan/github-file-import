

## Fix Login and Google Auth Issues

### Problem 1: Email/Password Login Has Stale Closure Bug
In `AuthContext.tsx`, the `login` function's `checkUser` polling references the `user` state variable from the React closure. Since React state updates don't mutate the captured variable, `user` is always `null` inside that closure. The login "succeeds" only after the 5-second fallback timeout, often causing the UI to show errors or appear broken.

**Fix:** Replace the polling mechanism with a proper approach using a ref or by simply not waiting -- the `onAuthStateChange` listener already handles setting the user state. The login function just needs to confirm Supabase auth succeeded and return.

### Problem 2: Google OAuth Post-Redirect Navigation
After Google OAuth redirect, the page reloads and `onAuthStateChange` picks up the session. But there's no logic to redirect the user to the dashboard after an OAuth login lands back on the login page.

**Fix:** Add a `useEffect` in `StudentLogin` that redirects authenticated users away from the login page.

### Files to Edit

| File | Change |
|------|--------|
| `src/contexts/AuthContext.tsx` | Fix login function: remove stale closure polling, just return success after `signInWithPassword` succeeds |
| `src/pages/StudentLogin.tsx` | Add useEffect to redirect already-authenticated users to dashboard |

### Technical Details

**AuthContext.tsx login function fix:**
```typescript
const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { success: false, error: error.message };
  
  if (data.user) {
    // Check if user is active
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_active')
      .eq('id', data.user.id)
      .single();
    
    if (profile?.is_active === false) {
      await supabase.auth.signOut();
      return { success: false, error: 'Account deactivated.' };
    }
    
    // Build user immediately instead of waiting for onAuthStateChange
    const appUser = await buildUser(data.user);
    setUser(appUser);
    return { success: true };
  }
  
  return { success: false, error: 'Login failed.' };
};
```

**StudentLogin.tsx redirect fix:**
```typescript
useEffect(() => {
  if (user) {
    navigate(redirectPath, { replace: true });
  }
}, [user]);
```

This ensures that after Google OAuth redirects back, the authenticated user is sent to the dashboard automatically.

### Expected Result
- Email/password login works instantly without 5-second delay
- Google OAuth login redirects to dashboard after authentication completes
- No more "fetch failed" errors caused by the auth lock timeout

