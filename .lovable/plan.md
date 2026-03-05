

# Fix: Vendor Employee Sidebar Empty — Permissions Not Loaded

## Problem
When a `vendor_employee` logs in, the sidebar is completely empty. The `useVendorEmployeePermissions` hook reads permissions from `user?.permissions`, but `AuthContext.buildUser()` never queries the `vendor_employees` table to populate this field — so it's always `undefined`, all permission checks return `false`, and every sidebar item is hidden.

## Root Cause
In `src/contexts/AuthContext.tsx`, the `buildUser` function only fetches the user's role from `user_roles`. It never fetches the employee's `permissions` array from `vendor_employees`, nor the `vendorId` (partner_user_id) needed for data scoping.

## Fix
Update `buildUser` in `AuthContext.tsx` to fetch permissions and vendorId from `vendor_employees` when the role is `vendor_employee`:

```typescript
// After determining role is 'vendor_employee':
const { data: empData } = await supabase
  .from('vendor_employees')
  .select('permissions, partner_user_id')
  .eq('employee_user_id', supabaseUser.id)
  .maybeSingle();

// Then include in the returned User object:
permissions: empData?.permissions || [],
vendorId: empData?.partner_user_id,
```

## File to Modify

| File | Change |
|------|--------|
| `src/contexts/AuthContext.tsx` | In `buildUser`, when role is `vendor_employee`, query `vendor_employees` table to get `permissions` and `partner_user_id`, and set them on the User object |

This is a single-file change. No UI modifications.

