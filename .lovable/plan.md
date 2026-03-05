

# Fix: Employee Can't See Seat Maps, Bookings, Receipts, Dues, Key Deposits

## Root Cause

The RLS policies are correct — employees CAN access partner data at the database level. The problem is in the **application code**: multiple service files explicitly filter queries with `.eq('created_by', authUser.id)` where `authUser.id` is the **employee's own ID**, not the partner's. Since properties are created by the partner, these queries return zero results regardless of RLS.

## What Needs to Change

### 1. Create a utility function to resolve the effective owner ID

Create `src/utils/getEffectiveOwnerId.ts` — a shared helper that:
- Calls `supabase.auth.getUser()` to get the authenticated user
- Checks `user_roles` to see if they're a `vendor_employee`
- If yes, looks up `vendor_employees.partner_user_id` and returns that
- Otherwise returns the user's own ID

This avoids duplicating the same logic in every service file.

### 2. Fix service files that filter by `created_by = authUser.id`

| File | Lines | Current Bug | Fix |
|------|-------|-------------|-----|
| `src/api/vendorSeatsService.ts` | ~218 | `.eq('created_by', authUser.id)` | Use `getEffectiveOwnerId()` |
| `src/api/hostelManagerService.ts` | 14, 35, 70, 98 | `.eq('created_by', user.id)` (4 places) | Use `getEffectiveOwnerId()` |
| `src/api/adminUsersService.ts` | 80-81 | `.eq('created_by', authUser.id)` for cabins/hostels | Use effective owner ID |
| `src/api/adminUsersService.ts` | 123 | `.eq('partner_user_id', authUser.id)` | Use effective owner ID |
| `src/api/hostelService.ts` | 132 | `.eq('created_by', user?.id)` | Use effective owner ID |

### 3. No database changes needed

The RLS policies (`is_partner_or_employee_of`) are already in place and working correctly. The issue is purely application-level query filtering.

## Technical Detail

The utility function pattern:

```typescript
// src/utils/getEffectiveOwnerId.ts
export async function getEffectiveOwnerId(): Promise<{ userId: string; ownerId: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
  const isEmployee = roles?.some(r => r.role === 'vendor_employee');
  
  if (isEmployee) {
    const { data: emp } = await supabase.from('vendor_employees')
      .select('partner_user_id')
      .eq('employee_user_id', user.id)
      .maybeSingle();
    if (emp?.partner_user_id) {
      return { userId: user.id, ownerId: emp.partner_user_id };
    }
  }
  
  return { userId: user.id, ownerId: user.id };
}
```

Each service file replaces `authUser.id` in `created_by` filters with `ownerId` from this function, so employees see the partner's properties.

## Files to Change

| File | Change |
|------|--------|
| `src/utils/getEffectiveOwnerId.ts` | **Create** — shared utility |
| `src/api/vendorSeatsService.ts` | Replace `authUser.id` with effective owner ID in cabin query |
| `src/api/hostelManagerService.ts` | Replace `user.id` with effective owner ID in 4 cabin queries |
| `src/api/adminUsersService.ts` | Replace `authUser.id` with effective owner ID in cabin/hostel/employee queries |
| `src/api/hostelService.ts` | Replace `user?.id` with effective owner ID in `getUserHostels` |

