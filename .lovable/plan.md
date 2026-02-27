

## Fix: Show Actual Locker Price from Booking Data in Admin Transactions

### Problem
The AdminBookings page (`/admin/bookings`) shows a single total amount. It needs to display the seat amount and locker amount separately, using the actual `locker_price` stored in each booking record (not a hardcoded value).

### Changes

#### 1. `src/api/adminBookingsService.ts` (line 82-93 in the mapping)
Add `lockerPrice` to the mapped output using the booking's actual `locker_price` column (already fetched via `*`):
```
lockerPrice: Number(b.locker_price) || 0,
```
Also fix `seatPrice` to reflect the actual seat cost (total minus locker):
```
seatPrice: (Number(b.total_price) || 0) - (Number(b.locker_price) || 0),
```

#### 2. `src/pages/AdminBookings.tsx` (line 167, the Amount cell)
Replace the single `₹{b.totalPrice}` with two lines:
- **Seat**: `totalPrice - lockerPrice` (the actual seat amount after discount)
- **Locker**: `lockerPrice` (only shown if > 0)

```
Seat: ₹2,300
Locker: ₹500      (only when locker > 0)
```

### Summary
- 2 files changed
- Uses actual `locker_price` from each booking record, not a hardcoded or default value
- Locker line only appears when the booking actually includes a locker
