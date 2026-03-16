

## Plan

### Issue 1: Add "Expired" bookings tab to Reading Room Expiring Bookings page

Currently the Expiring Bookings page only shows bookings that will expire in the future (using `gte('end_date', today)`). The user wants a second view showing bookings that have already expired.

**Changes:**
- **`src/pages/admin/ExpiringBookingsPage.tsx`**: Add a toggle/tab button ("Expiring" vs "Expired") at the top. When "Expired" is selected, fetch bookings where `end_date < today` instead. Show "Expired X days ago" badge instead of "Expires in X days".
- **`src/api/adminBookingsService.ts`**: Add a `getExpiredBookings` method that queries bookings with `end_date < today` and `payment_status = 'completed'`, ordered by `end_date` descending. Accept an optional `daysBack` parameter (default 30) to limit how far back to look.

### Issue 2: Split payment in Reading Room renewals only creates one receipt

**Root cause:** In `RenewalSheet.tsx` line 183, the `bookingSplits` array is NOT passed to `createPartnerBooking()`. The service only sees the primary split's method/txnId/proofUrl, so only one receipt is generated.

**Fix:**
- **`src/components/admin/RenewalSheet.tsx`** (line ~183): Add `bookingSplits: bookingSplits.map(s => ({ method: s.method, amount: s.amount, txnId: s.txnId, proofUrl: s.proofUrl }))` to the data object passed to `createPartnerBooking`. This matches what `VendorSeats.tsx` already does at line 737.

### Files to modify
| File | Change |
|------|--------|
| `src/api/adminBookingsService.ts` | Add `getExpiredBookings` method |
| `src/pages/admin/ExpiringBookingsPage.tsx` | Add Expiring/Expired toggle, call appropriate fetch method |
| `src/components/admin/RenewalSheet.tsx` | Pass `bookingSplits` to `createPartnerBooking` |

