
## Fix Build Error + Add Admin Password Reset

### 1. Fix Build Error in StudentLogin.tsx

Line 22 has a dangling `const StudentLogin` (leftover from the demo credentials removal). Remove that line so the component declaration on line 23 is the only one.

**File:** `src/pages/StudentLogin.tsx`
- Remove line 22 (`const StudentLogin`)

---

### 2. Also Fix: LoginDetails.tsx Contains Hardcoded Passwords

The `LoginDetails.tsx` page still has hardcoded mock passwords (`admin123`, `manager456`, `student123`, etc.) in state. This page and its related components (`LoginDetailsCard`, `ChangePasswordForm`, `login-details/types.ts`) use a mock/demo pattern that stores passwords in plaintext on the client. This entire page needs to be replaced with a real admin password reset system.

---

### 3. Create Edge Function for Admin Password Reset

**New file:** `supabase/functions/admin-reset-password/index.ts`

This edge function will:
- Accept `{ userId: string, newPassword: string }` in the request body
- Verify the caller is an authenticated admin using the `has_role` database function
- Use the Supabase Admin API (`supabase.auth.admin.updateUserById`) with the service role key to set the new password
- Return success/error response

Security measures:
- Validates JWT from Authorization header
- Checks caller has `admin` role via `has_role()` RPC
- Uses service role key server-side only
- Validates password length (minimum 6 characters)

---

### 4. Add Password Reset Button to AdminStudents Page

**File:** `src/pages/AdminStudents.tsx`

- Add a "Reset Password" button in the Actions column (next to Edit and View Details) -- only visible to admins
- Clicking opens a dialog to enter a new password
- On submit, calls the `admin-reset-password` edge function via `supabase.functions.invoke()`
- Shows success/error toast

**New component:** `src/components/admin/AdminResetPasswordDialog.tsx`

A simple dialog with:
- Display of the target user's name/email
- New password input field
- Confirm password input field
- Password validation (min 6 chars, passwords must match)
- Submit button that invokes the edge function

---

### 5. Remove Legacy LoginDetails Page

**Files to clean up:**
- `src/pages/LoginDetails.tsx` -- remove hardcoded passwords, replace with a redirect or remove the route
- The route referencing `/login-details` in `src/routes.tsx` should be removed

---

### Technical Summary

| File | Change |
|---|---|
| `src/pages/StudentLogin.tsx` | Fix build error: remove duplicate `const StudentLogin` on line 22 |
| `supabase/functions/admin-reset-password/index.ts` | New edge function: admin password reset using service role |
| `src/components/admin/AdminResetPasswordDialog.tsx` | New component: password reset dialog |
| `src/pages/AdminStudents.tsx` | Add "Reset Password" button in user actions |
| `src/pages/LoginDetails.tsx` | Remove hardcoded passwords, simplify or remove page |
| `src/routes.tsx` | Remove `/login-details` route if it exists |

**Database changes:** None required. Uses existing `has_role` function for authorization.

**Security model:**
- Only authenticated users with `admin` role can reset passwords
- Password is set server-side using Supabase Admin API (service role key never exposed to client)
- Minimum password length enforced both client-side and server-side
