

## Revamp Coupon Management Page

### Problem
The current CouponManagement page uses the old Card-wrapped UI with large fonts, no S.No. column, no pagination, and only supports "Reading Room" (cabin) coupons. It needs to match the compact admin table pattern and support both Reading Room and Hostel coupons with proper scope-based tabs.

### Solution
Completely rewrite `src/components/admin/CouponManagement.tsx` with:
1. Tabs: **All**, **Reading Room**, **Hostel** (filter by `applicableFor`)
2. Compact high-density table matching AdminStudents/Receipts pattern
3. S.No. column + AdminTablePagination
4. Updated create/edit dialog with Hostel option in "Applicable For"
5. Compact single-line filter row (Search + Scope dropdown + Type dropdown)
6. Fix the gl-matrix type error in tsconfig (skipLibCheck)

### Changes

**1. Rewrite `src/components/admin/CouponManagement.tsx`**

Layout matching AdminStudents pattern:
```text
[TicketPercent icon] Coupon Management  [Badge: X coupons]  [+ Create Coupon]

[All] [Reading Room] [Hostel]    <-- Tabs filter by applicableFor

[Search input] [Scope: All/Global/Partner] [Type: All/%/Fixed]   <-- Compact filter row

+------+----------+--------+------+-------+-------+--------+--------+---------+
| S.No.| Code     | Name   |Scope | Type  | Value | Usage  | Valid  | Actions |
+------+----------+--------+------+-------+-------+--------+--------+---------+
| 1    | SAVE20   | Save.. |Global| 20%   | max500| 5/100  | 31 Mar | Edit Del|
+------+----------+--------+------+-------+-------+--------+--------+---------+

Showing 1-10 of 48 entries    [1][2]...[5]    Rows [10 v]
```

Key UI changes:
- Remove Card wrappers, use flat layout
- Use `text-[11px]` fonts, `py-1.5 px-3` padding
- Tab value maps to applicableFor filter: `all`, `cabin`, `hostel`
- Add `currentPage`, `pageSize` state (default 10)
- Client-side pagination (slice filtered array)
- S.No. via `getSerialNumber`
- AdminTablePagination at bottom
- Compact action buttons (h-6 text-[10px])

Form dialog changes:
- Add "Hostel" option in Applicable For dropdown alongside "Reading Room"
- Add "All" option for admin-level global coupons
- Keep all existing fields (scope, vendor selection, user assignment, etc.)
- Make dialog layout more compact with smaller labels

**2. Fix `tsconfig.json` - Add skipLibCheck**
- The gl-matrix type errors are from node_modules and unrelated to our code
- Add `"skipLibCheck": true` to tsconfig compilerOptions if not already present

### Technical Details

- The coupon service uses the legacy Express/MongoDB backend via axios -- no changes needed to the service
- Tab filtering is done client-side: filter `coupons` array by `applicableFor` before slicing for pagination
- When tab is "all", show all coupons; when "cabin", show coupons where applicableFor includes "cabin"; when "hostel", show where applicableFor includes "hostel"
- Scope filter (Global/Partner/Referral) and Type filter (Percentage/Fixed) remain as inline dropdowns in the filter row
- The "+ Create Coupon" button stays in the header row
- Partner users (role=vendor) only see their own coupons (existing backend behavior)
- Admin users see all coupons with vendor column visible

### Files to Edit
| File | Change |
|------|--------|
| `src/components/admin/CouponManagement.tsx` | Complete rewrite with tabs, compact table, S.No., pagination |
| `tsconfig.json` | Add skipLibCheck to fix gl-matrix type errors |

