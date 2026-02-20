
# Connect App to Supabase & Make It Fully Runnable

## The Core Problem

Your app currently has two layers:
1. **Frontend** (React) — runs in Lovable's cloud preview at the URL you see
2. **Backend** (Express + MongoDB in `/backend` folder) — needs a separate server to run

The "Network Error" happens because the frontend tries to call `http://localhost:5000/api` — a local address that doesn't exist in Lovable's cloud environment. There is no localhost here.

You already have a Supabase project connected (the client is configured at `src/integrations/supabase/client.ts`). The goal is to wire up the frontend authentication to use Supabase directly, so the app works completely without needing the Express/MongoDB backend to be running.

## What Will Be Changed

### 1. AuthContext — Swap to Supabase Auth

`src/contexts/AuthContext.tsx` currently calls `authService.login()` which hits `http://localhost:5000/api/auth/login`. This will be replaced with `supabase.auth.signInWithPassword()` which works immediately from the browser.

- `login()` → `supabase.auth.signInWithPassword()`
- `registerUser()` → `supabase.auth.signUp()`
- `logout()` → `supabase.auth.signOut()`
- `isAuthenticated` → derived from `supabase.auth.getSession()`
- Session persistence handled automatically by Supabase (no more `localStorage.setItem('token')`)

### 2. User Roles — Stored Securely in Supabase

Following the security requirement, roles will be stored in a separate `user_roles` table, NOT on the user profile. A Supabase database migration will create:

```sql
-- Role enum
create type public.app_role as enum ('admin', 'student', 'vendor', 'vendor_employee', 'hostel_manager', 'super_admin');

-- Roles table (separate from profiles, prevents privilege escalation)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);

-- Security definer function to check roles (prevents RLS recursion)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
```

RLS on `user_roles`:
- Users can only read their own role
- Only service role (admins) can insert/update roles

### 3. Demo Accounts — Created in Supabase Auth

The demo accounts shown on login pages need to actually exist in Supabase Auth. They will be created via a Supabase migration (insert into auth.users via a seed approach), with roles assigned in `user_roles`:

| Email | Password | Role |
|---|---|---|
| admin@inhalestays.com | Admin@123 | admin |
| superadmin@inhalestays.com | Super@123 | super_admin |
| student@inhalestays.com | Student@123 | student |
| host@inhalestays.com | Host@123 | vendor |
| employee@inhalestays.com | Employee@123 | vendor_employee |

### 4. ProtectedRoute — Role Check via Supabase

`src/components/ProtectedRoute.tsx` currently reads `user.role` from the stored user object (which was set by the Express backend). After the change, the role will be fetched from the `user_roles` table using the Supabase client, so the role check is always server-validated and cannot be spoofed.

### 5. axiosConfig — No Changes Needed for Auth

The axios config (`src/api/axiosConfig.ts`) and all the Express API service files will remain untouched for now. The focus is getting **authentication and role-based routing** working fully via Supabase. All the booking/hostel/laundry data APIs can be connected to a backend later once deployed.

## Files to Create/Modify

| File | Action | What Changes |
|---|---|---|
| `supabase/migrations/...create_roles.sql` | CREATE | Creates `app_role` enum, `user_roles` table, `has_role()` function, RLS policies |
| `src/contexts/AuthContext.tsx` | MODIFY | Replace Express-based auth calls with Supabase Auth calls; fetch role from `user_roles` table |
| `src/components/ProtectedRoute.tsx` | MODIFY | Use role from AuthContext (which now comes from Supabase, not localStorage) |
| `src/pages/AdminLogin.tsx` | MINOR UPDATE | Ensure redirect-after-login still works correctly with the new auth flow |
| `src/pages/StudentLogin.tsx` | MINOR UPDATE | Same |
| `src/pages/vendor/VendorLogin.tsx` | MINOR UPDATE | Same |

## How It Will Work After

```text
User clicks "Use" on Admin demo credential
  → Email/password filled into form
  → User clicks Login
  → supabase.auth.signInWithPassword() called
  → Supabase validates credentials
  → Session returned (JWT stored securely by Supabase SDK)
  → AuthContext fetches role from user_roles table
  → user.role = 'admin'
  → ProtectedRoute checks role → PASS
  → User lands on /admin/dashboard ✓
```

## What Will Work Immediately

- All login pages (admin, student, vendor) — fully functional
- Role-based routing (admin goes to `/admin/dashboard`, student to `/student/dashboard`)
- Demo accounts — click "Use" then Login and it will actually authenticate
- Session persistence — refreshing the page keeps you logged in
- Logout — properly clears Supabase session

## What Still Requires the Backend

The data pages (bookings list, hostel data, laundry orders, etc.) still call the Express API at `localhost:5000`. They will show "Network Error" on data load, but navigation and auth will work. Connecting that data layer requires deploying the Express backend to a service like Railway, which is a separate step.

## Technical Notes

- Supabase is already connected (client configured at `src/integrations/supabase/client.ts`)
- No new packages needed — `@supabase/supabase-js` is already installed
- The `onAuthStateChange` listener will be set up before `getSession()` as required
- Roles are never stored in localStorage — always fetched live from Supabase on session restore
- The `has_role()` function uses `SECURITY DEFINER` to prevent RLS recursion
