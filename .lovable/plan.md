

## Fix: Replace Old Bookings List with Refactored Compact Table

### Problem
The route `/admin/bookings` still imports and renders the **old** `AdminBookingsList` component (from `src/components/admin/AdminBookingsList.tsx`) which has the Settlement column. The **new** refactored compact table lives in `src/pages/AdminBookings.tsx` but is never used.

### Changes

#### `src/App.tsx`
1. Replace the import of `AdminBookingsList` with `AdminBookings`:
   - Change `lazy(() => import("./components/admin/AdminBookingsList"))` to `lazy(() => import("./pages/AdminBookings"))`
2. Update the route element from `<AdminBookingsList />` to `<AdminBookings />`

That is the only file that needs to change. The new `AdminBookings` page already has:
- No Settlement column
- Compact row height (~40px)
- Single-line dates
- Icon-only action buttons with tooltips
- 15 rows per page with "Showing X-Y of Z entries" footer

| File | Change |
|------|--------|
| `src/App.tsx` | Swap import + route from old `AdminBookingsList` to new `AdminBookings` |

