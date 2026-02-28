
## Redesign User Management Page with Role Tabs

### Problem
The current AdminStudents page uses an outdated UI with a Card wrapper, large fonts, a role dropdown selector, and inline pagination that doesn't match the compact, high-density admin table style used in Receipts, Bookings, and other admin pages. The service also filters by role client-side after fetching, which breaks server-side pagination counts.

### Solution
Completely rewrite the AdminStudents page with:
1. Separate tabs for Admins, Partners, Students, and Employees
2. Compact table style matching Receipts/Deposits (text-xs, tight padding)
3. S.No. column with AdminTablePagination
4. Proper role-based columns (different info shown per tab)
5. Fix the service to filter by role server-side

### Changes

**1. Fix `src/api/adminUsersService.ts` - Server-side role filtering**
- Currently fetches all profiles then filters by role client-side, which breaks pagination counts
- Add role filtering by joining with `user_roles` table before pagination
- Query `user_roles` first for the target role, get those user IDs, then fetch profiles for those IDs only
- This ensures `totalCount` is accurate per role

**2. Rewrite `src/pages/AdminStudents.tsx` - Complete redesign**
- Remove Card wrapper, use flat layout matching Receipts page
- Replace role dropdown with Tabs component (Admins, Partners, Students, Employees)
- Each tab shares the same table component but with role-specific columns:
  - **Students tab**: S.No., Name (with phone/email below), Gender, Course, College, Bookings (Active/Total), Status, Actions
  - **Partners tab**: S.No., Name (with phone/email below), Gender, Status, Actions
  - **Admins tab**: S.No., Name (with phone/email below), Status, Actions
  - **Employees tab**: S.No., Name (with phone/email below), Gender, Status, Actions
- Compact filter row: Search input + Include Inactive switch (single line, h-8 inputs)
- AdminTablePagination at bottom
- Keep existing dialogs: StudentEditDialog, AdminResetPasswordDialog, View Details dialog
- Make View Details dialog compact too
- Table uses text-xs fonts, muted-foreground for secondary text, compact row heights

**3. UI Pattern (matching Receipts)**
```text
[Users icon] User Management   [Badge: X users]

[Students] [Partners] [Admins] [Employees]    <-- Tabs

[Search input] [Include Inactive toggle]       <-- Compact filter row

+------+------------------+--------+----------+--------+---------+
| S.No.| Student          | Gender | Course   |Bookings| Actions |
+------+------------------+--------+----------+--------+---------+
| 1    | John Doe         | Male   | UPSC     | 2 Act  | Edit    |
|      | 9876543210       |        | ABC Univ | 5 Tot  | Reset   |
|      | john@email.com   |        |          |        | View    |
+------+------------------+--------+----------+--------+---------+

Showing 1-10 of 148 entries    [1][2]...[15]    Rows [10 v]
```

### Technical Details

- Tab value maps to role: `student`, `vendor`, `admin`, `vendor_employee`
- When tab changes, reset page to 1 and re-fetch with new role
- Service change: fetch user IDs from `user_roles` by role first, then fetch profiles with `.in('id', userIds)` and use those for count
- The Include Inactive toggle remains for admin use
- Student name column shows phone and email as sub-lines (matching the student-contact-visibility memory)
- Actions column: Edit (students only, admin only), Reset Password (admin only), View Details (all)

### Files to Edit
| File | Change |
|------|--------|
| `src/api/adminUsersService.ts` | Fix role filtering to be server-side via user_roles join |
| `src/pages/AdminStudents.tsx` | Complete rewrite with tabs and compact table UI |
