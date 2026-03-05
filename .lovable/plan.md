

# Fix: Partner Employee Login Not Working

## Root Cause

When a partner creates an employee via the Employee Management form, it only inserts a record into the `vendor_employees` table (name, email, phone, permissions). **No auth user account is created**, so the employee has no credentials to log in with.

By contrast, the admin employee form correctly calls the `admin-create-user` edge function to create an actual auth user before inserting the employee record.

## Solution

Mirror the admin employee creation pattern in the vendor employee flow:

### 1. Create a new edge function: `partner-create-employee`

A dedicated edge function that:
- Verifies the caller is authenticated and has the `vendor` role
- Creates a new auth user with `email_confirm: true`
- Assigns `vendor_employee` role in `user_roles` (removes default `student` role)
- Updates the profile with name and phone
- Returns the new user ID

This is separate from `admin-create-user` because partners should only be able to create `vendor_employee` users, not admins or other roles.

### 2. Update `VendorEmployeeForm.tsx`

- Add a **password** field (required for new employees, hidden when editing)
- On create: call the `partner-create-employee` edge function first, then insert into `vendor_employees` with the returned user ID

### 3. Add `employee_user_id` column to `vendor_employees` table

A new nullable UUID column to link the employee record to the auth user, enabling future features like permission checks on login.

### 4. Update `vendorEmployeeService.ts`

Pass `employee_user_id` when creating the employee record.

## Files to Create/Modify

| File | Change |
|------|--------|
| `supabase/functions/partner-create-employee/index.ts` | New edge function to create vendor_employee auth users |
| `src/components/vendor/VendorEmployeeForm.tsx` | Add password field; call edge function on create |
| `src/api/vendorEmployeeService.ts` | Accept and pass `employee_user_id` |
| DB migration | Add `employee_user_id` column to `vendor_employees` |

