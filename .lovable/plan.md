

## Add User Activate/Deactivate Feature

### Problem
Currently there is no way for admins to activate or deactivate users. All users are hardcoded as `isActive: true` in the service layer. When a user is deactivated, they should be blocked from logging in.

### Solution
1. Add an `is_active` column to the `profiles` table (default `true`)
2. Add activate/deactivate toggle buttons in the user table
3. Check `is_active` status after login and sign out deactivated users
4. Fix the gl-matrix build error by excluding it from type checking

---

### Changes

**1. Database Migration -- Add `is_active` to profiles**
```sql
ALTER TABLE profiles ADD COLUMN is_active boolean NOT NULL DEFAULT true;
```

**2. Update `src/api/adminUsersService.ts`**
- Map `is_active` from profile data instead of hardcoding `true`
- Add a new `toggleUserActive(userId, isActive)` method that updates `profiles.is_active`
- When deactivating, also call `supabase.auth.admin` via a new edge function to ban/unban the user

**3. Create Edge Function `supabase/functions/toggle-user-status/index.ts`**
- Accepts `userId` and `isActive`
- Validates caller is admin
- Uses `supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: isActive ? 'none' : '876000h' })` to ban/unban from auth
- Also updates `profiles.is_active`
- Banned users cannot log in at all (Supabase blocks them at the auth level)

**4. Update `src/pages/AdminStudents.tsx`**
- Add a Status column showing Active/Inactive badge
- Add an Activate/Deactivate toggle button in the Actions column per user row
- On click, call the toggle edge function and refresh the list
- Show confirmation before deactivating

**5. Update `src/contexts/AuthContext.tsx`**
- After successful login, check `profiles.is_active`
- If `false`, sign the user out immediately and return an error: "Your account has been deactivated. Please contact admin."

**6. Fix gl-matrix build error**
- The gl-matrix type errors persist despite `skipLibCheck: true`. Add the `gl-matrix` path to the `exclude` array in `tsconfig.app.json` to suppress them.

---

### Technical Details

- Banning at the Supabase Auth level (`ban_duration`) is the most secure approach -- blocked users cannot obtain tokens at all
- The `profiles.is_active` column serves as a UI indicator and a secondary check
- The edge function uses `SUPABASE_SERVICE_ROLE_KEY` to call `auth.admin.updateUserById`
- The status toggle is available for all user types (students, partners, admins, employees)

### Files to Create
| File | Purpose |
|------|---------|
| `supabase/functions/toggle-user-status/index.ts` | Edge function to ban/unban users |

### Files to Edit
| File | Change |
|------|--------|
| Database migration | Add `is_active` column to profiles |
| `src/api/adminUsersService.ts` | Map `is_active`, add `toggleUserActive` method |
| `src/pages/AdminStudents.tsx` | Add Status column, Activate/Deactivate button |
| `src/contexts/AuthContext.tsx` | Check `is_active` after login, block if deactivated |
| `supabase/config.toml` | Add `toggle-user-status` function config |
| `tsconfig.app.json` | Fix gl-matrix type error |

