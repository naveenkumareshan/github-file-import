

# Fix: Employee Seat Map Shows 0 Seats After Login

## Root Cause

The `VendorSeats` component fetches cabins in a `useEffect([], [])` that runs once on mount. Inside `getVendorCabins()`, it calls `getEffectiveOwnerId()` which calls `supabase.auth.getUser()`. On fresh login, there's a race condition where the Supabase session token may not be fully propagated when this first request fires, causing the query to silently return 0 results. Since `cabins` stays empty, `fetchSeats` early-returns (`cabins.length === 0`), showing "0 seats."

Additionally, two module-level caches (`roleCache` in AuthContext and `cachedResult` in `getEffectiveOwnerId`) are **never cleared on logout**, which can cause stale data across sessions.

## Fix

### 1. Clear caches on logout (`src/contexts/AuthContext.tsx`)
- Import `clearEffectiveOwnerCache` and call it in the `logout` function
- Clear `roleCache` on logout as well

### 2. Re-fetch cabins when user changes (`src/pages/vendor/VendorSeats.tsx`)
- Add `user?.id` to the cabin-fetching `useEffect` dependency array so it re-runs when auth state settles
- This ensures that if the first fetch fires before auth is ready (returning 0 cabins), it automatically retries once the user object is set

### 3. Add error handling for getEffectiveOwnerId failure (`src/api/vendorSeatsService.ts`)
- If `getEffectiveOwnerId()` throws (user not authenticated yet), catch and retry or skip the `created_by` filter, letting RLS handle access control alone

## Files Changed
- `src/contexts/AuthContext.tsx` — Clear `roleCache` and `effectiveOwnerCache` on logout
- `src/pages/vendor/VendorSeats.tsx` — Add `user?.id` dependency to cabin fetch useEffect
- `src/api/vendorSeatsService.ts` — Graceful fallback when `getEffectiveOwnerId` fails

