
# Fix Access Issues — Admin Login & Protected Route Redirects

## Root Causes Found

### Problem 1: Wrong redirect path for unauthenticated users on admin routes
In `src/components/ProtectedRoute.tsx`, the default `redirectPath` is `/` (the homepage). When a user tries to access `/admin/vendorpayouts` without being logged in, they get sent to `/?from=/admin/vendorpayouts` instead of `/admin/login?from=/admin/vendorpayouts`.

The admin routes in `App.tsx` use `<ProtectedRoute requiredRole="admin">` but never set `redirectPath="/admin/login"`, so everyone lands on the homepage confused.

### Problem 2: AdminLogin uses `login()` return value incorrectly
In `src/pages/AdminLogin.tsx` line 36, the code does:
```
if (success) { ... }
```
But `login()` returns `{ success: boolean; error?: string }` — an **object**, not a boolean. In JavaScript, any object is truthy, so `if (success)` is always `true`, even when login fails. The correct check should be `if (success.success)`.

### Problem 3: No redirect after successful login based on `from` query param
After a successful admin login, the code always navigates to `/admin/dashboard`. If the user was trying to reach `/admin/vendorpayouts`, they should be sent back there after login.

### Problem 4: ProtectedRoute has a logic error in role checking
On line 35, the check reads:
```js
if (requiredRole === 'admin' && (user?.role === 'admin' || ...))
```
This means if the required role IS `admin` AND the user IS an admin, it enters this block and renders content — which is correct. But when the required role is `admin` and the user's role is something else, it falls through to the role-specific redirects. The logic works but only because of how the conditions are arranged, which is confusing and fragile.

## Files to Modify

### 1. `src/pages/AdminLogin.tsx`
- Fix `if (success)` → `if (success.success)`
- After successful login, read the `?from=` query parameter and redirect there instead of always going to `/admin/dashboard`

### 2. `src/App.tsx`
- Add `redirectPath="/admin/login"` to the admin `<ProtectedRoute>` wrapper so unauthenticated users land on the admin login page

### 3. `src/components/ProtectedRoute.tsx`
- Clean up the logic so that when a user is not authenticated AND the route has `requiredRole="admin"`, they go to `/admin/login` instead of the generic `redirectPath`
- Alternatively, this is handled by fixing App.tsx to pass `redirectPath="/admin/login"` explicitly

## Detailed Changes

### `src/App.tsx` — Line ~177
Change:
```jsx
<ProtectedRoute requiredRole="admin">
```
To:
```jsx
<ProtectedRoute requiredRole="admin" redirectPath="/admin/login">
```

### `src/pages/AdminLogin.tsx` — handleSubmit function
Change:
```js
const success = await login(formData.email, formData.password);
if (success) {
  ...
  navigate('/admin/dashboard');
}
```
To:
```js
const result = await login(formData.email, formData.password);
if (result.success) {
  // Read the 'from' param and redirect appropriately
  const params = new URLSearchParams(window.location.search);
  const from = params.get('from') || '/admin/dashboard';
  navigate(from);
} else {
  toast({
    title: "Login Failed",
    description: result.error || "Invalid email or password.",
    variant: "destructive"
  });
}
```

### `src/pages/StudentLogin.tsx` — verify same pattern
Quick check to ensure the student login has the same fix applied for consistency.

## Summary of Impact
- Admin users navigating to any protected admin page will now be redirected to `/admin/login` (not the homepage)
- After a successful admin login, users are taken back to the page they originally tried to access
- The login failure toast now shows the actual error message from the backend instead of a hardcoded generic message
- No changes to the backend, authentication logic, or database
