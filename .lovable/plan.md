

## Fix: Booking Confirmation Failing - Serial Counter RLS Block

### Root Cause

The `generate_serial_number` database function is being blocked by security policies on the `serial_counters` table. The previous migration only added the foreign key constraint but **did not** apply the `SECURITY DEFINER` fix to the function. The function still runs as `INVOKER` (confirmed), so when a partner tries to create a booking, the serial number generation fails because the `serial_counters` table blocks all direct access.

### Fix

**Database Migration** - Recreate the `generate_serial_number` function with `SECURITY DEFINER`:

The function must be fully redefined (not just altered) with `SECURITY DEFINER` so it runs with the function owner's privileges, bypassing the RLS policy on `serial_counters`.

| File | Change |
|------|--------|
| New SQL migration | `CREATE OR REPLACE FUNCTION generate_serial_number(p_entity_type text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public` with the same function body |

### Why the previous fix didn't work

PostgreSQL does not support `ALTER FUNCTION ... SECURITY DEFINER` in all contexts the same way. The migration file only contained the FK constraint. The `SECURITY DEFINER` statement was either not included or silently failed. The fix is to use `CREATE OR REPLACE FUNCTION` which fully redefines the function with the correct security setting.

### What this fixes

- Partner booking confirmation ("Confirm Booking" button) will work
- Serial numbers will be generated correctly for all entity types
- The invoice success view will display after booking

No frontend code changes needed -- the UI code is already correct.

