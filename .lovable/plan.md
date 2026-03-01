
# Fix Booking Card Badges

## Problems
1. **Two redundant badges**: Cards show both "Paid" (from payment status) AND "Fully Paid" -- only one badge is needed.
2. **Incorrect "Fully Paid" for advance_paid bookings**: Bookings with `advance_paid` status show "Fully Paid" even when there are outstanding dues, because the logic treats `advance_paid` the same as `completed`.

## Changes

**File**: `src/components/booking/BookingsList.tsx`

### 1. Remove the old payment status badge (line 192)
Remove `{booking.paymentStatus && getStatusBadge(booking.paymentStatus)}` so only one badge is shown.

### 2. Fix the due/fully-paid logic (lines 196-200)
Replace the current logic with:
- If `dueAmount > 0` --> show red "Due: X" badge
- If `paymentStatus === 'advance_paid'` (and no due in map) --> show orange "Advance Paid" badge (not "Fully Paid")
- If `paymentStatus === 'completed'` and no dues --> show green "Fully Paid" badge  
- If `paymentStatus === 'pending'` --> show amber "Pending" badge
- If `paymentStatus === 'failed'` or `'cancelled'` --> show red badge

This ensures only one meaningful badge per card, and `advance_paid` bookings never falsely show as "Fully Paid".
