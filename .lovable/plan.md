

## 1. Add S.No. and Pagination to Operations Page Tables

### Changes to `src/components/admin/operations/CheckInTracker.tsx`
- Add `useState` for `currentPage` (default 1) and `pageSize` (default 10)
- Add S.No. column as first column in the pending table header
- Add S.No. cell using `getSerialNumber(index, currentPage, pageSize)` in each row
- Slice `filtered` array for current page: `filtered.slice((currentPage-1)*pageSize, currentPage*pageSize)`
- Add `<AdminTablePagination>` below the pending table
- Import `AdminTablePagination` and `getSerialNumber`

### Changes to `src/components/admin/operations/ReportedTodaySection.tsx`
- Add S.No. column as first column in the reported today table
- Simple sequential numbering (index + 1) since this is a small collapsible section

### Changes to `src/components/admin/operations/ComplaintTracker.tsx`
- Add `useState` for `currentPage` (default 1) and `pageSize` (default 10)
- Add S.No. column as first column in the complaints table header
- Add S.No. cell using `getSerialNumber(index, currentPage, pageSize)` in each row
- Paginate the `filtered` array client-side
- Add `<AdminTablePagination>` below the complaints table
- Import `AdminTablePagination` and `getSerialNumber`

---

## 2. Redesign Users Page to Match Admin Table Style

### Changes to `src/components/admin/login-details/UserTable.tsx`
Complete restyle to match the high-density admin table pattern used in Receipts/Deposits:
- Use the same `text-[11px]` font size, `py-1.5 px-3` padding, `border rounded-lg` wrapper
- Add S.No. as first column
- Accept `currentPage` and `pageSize` props for serial number calculation
- Replace large Avatar with a compact inline layout (smaller avatar or initials only)
- Use Badge component for role display (matching the style used in other admin tables)
- Compact action buttons matching the small button style (`h-6 text-[10px]`)
- Remove localStorage lookups for gender/image/address (these are unreliable and not matching other pages)

### Changes to `src/components/admin/login-details/UserSection.tsx`
- Add `currentPage`, `pageSize` state
- Paginate the users array client-side
- Add `<AdminTablePagination>` below the UserTable
- Pass `currentPage` and `pageSize` to UserTable for S.No. calculation

### Changes to `src/components/admin/LoginDetailsCard.tsx`
- Remove the outer `<Card>` wrapper to flatten the layout (matching other admin pages that don't wrap tables in cards)
- Or keep the card but make it borderless/minimal to match the clean look

---

## Summary of Files to Edit

| File | What Changes |
|------|-------------|
| `CheckInTracker.tsx` | Add S.No. column + pagination |
| `ComplaintTracker.tsx` | Add S.No. column + pagination |
| `ReportedTodaySection.tsx` | Add S.No. column |
| `UserTable.tsx` | Full restyle to match admin table pattern + S.No. |
| `UserSection.tsx` | Add pagination state + AdminTablePagination |
| `LoginDetailsCard.tsx` | Minor cleanup for consistency |

