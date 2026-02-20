
## Two Issues — Root Causes & Fixes

### Issue 1: Security Warning — Leaked Password Protection Disabled

**Root cause:** The Lovable Cloud auth configuration has "Leaked Password Protection" disabled. This is a global auth security setting that checks user passwords against known breached password databases when signing up or changing passwords.

**Fix:** Enable it in `supabase/config.toml` by adding the `[auth.password]` config block:
```toml
[auth.password]
hibp_enabled = true
min_length = 6
```

This will silently stop the security warning banner — it's a one-line fix.

---

### Issue 2: Student Bookings Pages Failing & Slow

**Root cause (confirmed from console logs):**

```
AxiosError: Network Error
ERR_NETWORK
baseURL: "http://localhost:5000/api"
url: "/bookings/user/current"
```

`StudentBookings.tsx` (the `/student/bookings` route) imports from `bookingManagementService` which hits **`http://localhost:5000/api`** — the old Express/MongoDB backend that doesn't exist in the cloud deployment. Every call instantly fails with a Network Error, causing:
- Infinite loading spinner
- "Failed to fetch your bookings" toast error
- Page appears broken/slow because it waits for requests that time out

There is already a correct Supabase-native service — `bookingsService.ts` — that directly queries the cloud database. `ProfileManagement.tsx` already uses this correctly.

**Files to fix:**

#### 1. `src/pages/StudentBookings.tsx`
- Change import from `bookingManagementService` → `bookingsService`
- Replace `bookingManagementService.getCurrentBookings()` → `bookingsService.getCurrentBookings()`
- Replace `bookingManagementService.getBookingHistory()` → `bookingsService.getBookingHistory()`
- Update the `mapBooking()` function to match the Supabase response shape (snake_case fields like `cabin_id`, `seat_number`, `start_date`, `end_date`, `payment_status`, `created_at`)

#### 2. `src/pages/StudentDashboard.tsx`
- This already uses `bookingsService` (correct) but has the same mapping issue — the response fields are snake_case (`cabin_id`, `start_date`, `end_date`) but the code reads camelCase (`cabinId.name`, `seatId.number`)
- Fix the field mapping in both the display template and the `totalSpent` calculation

#### 3. `supabase/config.toml`
- Add `[auth.password]` section to enable leaked password protection

---

### Technical Summary

| Problem | Location | Root Cause | Fix |
|---|---|---|---|
| Security warning | `supabase/config.toml` | `hibp_enabled` not set | Add `hibp_enabled = true` |
| Bookings page fails | `StudentBookings.tsx` | Calls `localhost:5000` via `bookingManagementService` | Switch to `bookingsService` (Supabase) |
| Data mapping errors | `StudentBookings.tsx` + `StudentDashboard.tsx` | Expects MongoDB camelCase, gets Supabase snake_case | Fix field name mapping |

No database migration needed — the `bookings` table already exists and `bookingsService.ts` already queries it correctly.
