

# Sync Profile Booking Status Badges with Bookings List

## Problem
The "My Bookings" section on the Profile page shows raw `payment_status` values (e.g., `advance_paid`, `pending`, `completed`) while the main Bookings list page uses a richer, prioritized badge system: "Due: ₹X" (red), "Fully Paid" (green), "Advance Paid" (orange), etc. These should match.

## Solution
Update `ProfileManagement.tsx` to use the same prioritized badge logic as `BookingsList.tsx`:

1. **Fetch due amounts** alongside bookings -- query the `dues` table to get outstanding amounts for each booking
2. **Apply the same badge priority** used in BookingsList:
   - If `dueAmount > 0` -- show red "Due: ₹X" badge
   - If `payment_status === 'completed'` and no dues -- show green "Fully Paid" badge
   - If `payment_status === 'advance_paid'` -- show orange "Advance Paid" badge
   - If `payment_status === 'pending'` -- show amber "Pending" badge
   - If `failed` or `cancelled` -- show red "Failed" / "Cancelled" badge

## Technical Details

### File: `src/components/profile/ProfileManagement.tsx`

**Change 1**: In `loadBookings()`, after fetching bookings, also fetch dues for those booking IDs from the `dues` table. Attach `dueAmount` (= `due_amount - paid_amount`) to each booking object.

**Change 2**: Replace the current raw status span (lines 450-452):
```tsx
<span className={`... ${statusColor[b.payment_status] || '...'}`}>
  {b.payment_status}
</span>
```
with the prioritized badge logic matching BookingsList:
```tsx
{(b.dueAmount ?? 0) > 0 ? (
  <Badge variant="outline" className="border-red-500 text-red-600 text-[10px] px-1.5 py-0.5">
    Due: Rs.{b.dueAmount?.toLocaleString()}
  </Badge>
) : b.payment_status === 'completed' ? (
  <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] px-1.5 py-0.5">
    Fully Paid
  </Badge>
) : b.payment_status === 'advance_paid' ? (
  <Badge variant="outline" className="border-amber-500 text-amber-600 text-[10px] px-1.5 py-0.5">
    Advance Paid
  </Badge>
) : b.payment_status === 'pending' ? (
  <Badge variant="outline" className="border-amber-500 text-amber-500 text-[10px] px-1.5 py-0.5">
    Pending
  </Badge>
) : (
  <Badge variant="outline" className="border-destructive text-destructive text-[10px] px-1.5 py-0.5">
    {b.payment_status}
  </Badge>
)}
```

**Change 3**: Add `Badge` to the imports from `@/components/ui/badge`.

**Change 4**: The `statusColor` map can be removed since it's no longer used.

No database changes needed.
