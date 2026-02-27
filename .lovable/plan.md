

## Fix: Booking Click on Profile Goes to Wrong Page

### Problem
When clicking a booking card in "My Bookings" on the student profile, the link navigates to `/student/bookings/{id}/transactions/cabin` (the transaction history page) instead of `/student/bookings/{id}` (the booking detail page).

### Fix

**File: `src/components/profile/ProfileManagement.tsx`**

Change line 385 from:
```tsx
<Link key={b.id} to={`/student/bookings/${b.id}/transactions/cabin`}>
```
to:
```tsx
<Link key={b.id} to={`/student/bookings/${b.id}`}>
```

This routes to the booking detail view (`StudentBookingView`) instead of the transaction history view (`BookingTransactions`).

### Technical Details

| File | Change |
|------|--------|
| `src/components/profile/ProfileManagement.tsx` | Update Link `to` prop on line 385 to point to booking detail route |

