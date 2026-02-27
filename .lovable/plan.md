

## Fix Expired Toast Loop and Advance-Paid Booking Classification

### Problem 1: Expired Toast Keeps Firing
The `PaymentTimer` component calls `onExpiry()` on every interval tick (every second) once the timer hits zero. This causes the toast and cancellation API call to fire repeatedly.

**Fix in `src/components/booking/PaymentTimer.tsx`**:
- Add a `useRef` flag (`hasExpiredRef`) to track whether `onExpiry` has already been called.
- Only call `onExpiry()` once, then set the flag to `true`.

```typescript
const hasExpiredRef = useRef(false);

// Inside calculateTimeLeft:
if (remainingMs === 0) {
  setTimeLeft(0);
  setIsExpired(true);
  if (onExpiry && !hasExpiredRef.current) {
    hasExpiredRef.current = true;
    onExpiry();
  }
}
```

---

### Problem 2: Advance-Paid Bookings Appearing in Expired Tab
Two sub-issues:
1. `getCurrentBookings()` in `bookingsService.ts` only fetches `.eq('payment_status', 'completed')`, so `advance_paid` bookings are excluded from the Active tab.
2. The expired filter in `StudentBookings.tsx` line 154 uses `b.paymentStatus !== 'completed'`, which catches `advance_paid` as "not completed" and puts them in Expired.

**Fix in `src/api/bookingsService.ts` (`getCurrentBookings`)**:
- Change `.eq('payment_status', 'completed')` to `.in('payment_status', ['completed', 'advance_paid'])` so active advance-paid bookings appear in the Active tab.

**Fix in `src/pages/StudentBookings.tsx` (line 154)**:
- Update the expired filter to exclude `advance_paid` from showing up as expired:
```typescript
setPastBookings(
  allHistory.filter((b: Booking) =>
    (b.endDate < today && !['pending'].includes(b.paymentStatus)) ||
    ['failed', 'cancelled'].includes(b.paymentStatus)
  )
);
```

This ensures:
- **Active tab**: Shows ongoing bookings with `completed` or `advance_paid` status whose end date is >= today
- **Expired tab**: Only shows bookings whose end date has truly passed, or those with `failed`/`cancelled` status
- `advance_paid` bookings with a future end date stay in the Active tab

---

### Files Modified

| File | Change |
|------|--------|
| `src/components/booking/PaymentTimer.tsx` | Add ref guard to prevent `onExpiry` from firing repeatedly |
| `src/api/bookingsService.ts` | Include `advance_paid` in `getCurrentBookings` query |
| `src/pages/StudentBookings.tsx` | Fix expired tab filter to only show truly expired or failed/cancelled bookings |
