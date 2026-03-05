

# Fix: Employee Still Cannot See Seats, Bookings, Receipts, Dues, Key Deposits

## Root Cause Summary

There are **two layers** of problems, both preventing employees from seeing data:

### Layer 1: Missing RLS Policies (Database)
The `receipts` and `seat_block_history` tables have vendor policies checking `c.created_by = auth.uid()` but **no employee policies** using `is_partner_or_employee_of`. This means employees are blocked at the database level from reading receipts and seat block history.

### Layer 2: Application-Level Filtering (Code)
Many page components and hooks still filter with `.eq('created_by', user.id)` where `user.id` is the employee's own ID. Even though the `vendorSeatsService.getVendorCabins()` was fixed, **multiple other pages** bypass that service and query directly. These pages return zero results for employees.

## Affected Files and Fixes

### Database Migration — Add Employee RLS Policies

| Table | Missing Policy | Fix |
|-------|---------------|-----|
| `receipts` | No employee SELECT/INSERT | Add `is_partner_or_employee_of(c.created_by)` policy for ALL |
| `seat_block_history` | No employee policy | Add `is_partner_or_employee_of(c.created_by)` via seats→cabins join |

### Code Fixes — Replace `user.id` with Effective Owner ID

These files all have direct `.eq('created_by', user.id)` that returns nothing for employees:

| File | Location | Current Bug |
|------|----------|-------------|
| `src/pages/admin/HostelBedMap.tsx` | line 177 | `.eq('created_by', user.id)` |
| `src/pages/admin/HostelReceipts.tsx` | line 65 | `.eq('created_by', user.id)` |
| `src/pages/admin/HostelDueManagement.tsx` | line 68 | `.eq('created_by', user.id)` |
| `src/components/admin/StudentExcelImport.tsx` | lines 78, 89 | `.eq('created_by', user.id)` |
| `src/hooks/usePartnerPerformance.ts` | lines 169-171 | `.eq('created_by', user.id)` x3 |
| `src/components/vendor/VendorProfile.tsx` | lines 107-108 | `.eq('created_by', user.id)` x2 |

**Fix pattern**: Import and call `getEffectiveOwnerId()` to get the partner's ID, then use that in the query filter. For files using `useAuth()` context, we can use `user.vendorId || user.id` since the AuthContext already resolves `vendorId` for employees.

### Receipts Page — No Cabin Filtering for Employees

`src/pages/admin/Receipts.tsx` fetches all receipts without any cabin filter. RLS will now handle scoping (once the policy is added), but the cabin dropdown also fetches unfiltered — it should use `getEffectiveOwnerId()` so employees see only their partner's cabins.

### Deposit/Refund Service

`src/api/depositRefundService.ts` queries bookings directly — RLS already handles scoping via the existing employee booking policies, so no code change needed there.

## Changes Summary

| Item | Change |
|------|--------|
| **DB Migration** | Add employee RLS policies on `receipts` and `seat_block_history` |
| `src/pages/admin/HostelBedMap.tsx` | Use `getEffectiveOwnerId()` instead of `user.id` |
| `src/pages/admin/HostelReceipts.tsx` | Use `getEffectiveOwnerId()` instead of `user.id` |
| `src/pages/admin/HostelDueManagement.tsx` | Use `getEffectiveOwnerId()` instead of `user.id` |
| `src/pages/admin/Receipts.tsx` | Use `getEffectiveOwnerId()` for cabin filter query |
| `src/components/admin/StudentExcelImport.tsx` | Use `getEffectiveOwnerId()` instead of `user.id` |
| `src/hooks/usePartnerPerformance.ts` | Use `getEffectiveOwnerId()` instead of `user.id` |
| `src/components/vendor/VendorProfile.tsx` | Use `getEffectiveOwnerId()` instead of `user.id` |

This covers all the remaining places where employee queries are broken.

