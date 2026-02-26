

## Fix All Transactions Table and Detail Navigation

### Problems Identified

1. **Action buttons (green tick / red X)**: The "Complete" and "Cancel" icon buttons in the Actions column don't belong in a transactions listing. Only the "View Details" (eye) button should remain.

2. **Detail page not loading properly**: When clicking the eye icon, it navigates to `/admin/bookings/${b._id}` but the route for `AdminBookingDetail` expects `/admin/bookings/:bookingId/:type`. The missing `/cabin` segment means the detail page (with Payment Summary and Payment Receipts) never renders correctly.

### Changes

#### 1. `src/pages/AdminBookings.tsx`

- **Remove** the `handleUpdateStatus` function entirely (lines 81-93)
- **Remove** the `CheckCircle2` and `XCircle` imports
- **Remove** the green tick and red X buttons from the Actions column (lines 182-195), keeping only the Eye (Details) button
- **Fix navigation URL**: Change `navigate(\`/admin/bookings/${b._id}\`)` to `navigate(\`/admin/bookings/${b._id}/cabin\`)` so the route matches `bookings/:bookingId/:type` and the detail page loads with Payment Summary + Payment Receipts

#### Result
- Actions column will only show a single "Details" eye icon per row
- Clicking it will correctly open the `AdminBookingDetail` page with the full Payment Summary (9-field breakdown) and Payment Receipts table

### Files Changed

| File | Change |
|------|--------|
| `src/pages/AdminBookings.tsx` | Remove Complete/Cancel buttons, remove `handleUpdateStatus`, fix detail navigation URL to include `/cabin` type |

