

## Fix "View Details" Page -- BookingTransactionView Crashes

The "View Details" page crashes due to multiple bugs in `BookingTransactionView.tsx` when it receives booking data from the student view. There are 3 distinct crash points:

### Root Causes

**Crash 1 -- Line 174: `booking.seatPrice.toLocaleString()`**
The `StudentBookingView` passes a mapped `BookingDetail` object that does NOT have a `seatPrice` property. The code tries to call `.toLocaleString()` on `undefined`, causing an immediate crash.

**Crash 2 -- Line 74: `transactionsResponse.data.data.filter(...)`**
The `getUserTransactions()` service returns `{ success: true, data: [] }` (a flat array), but the code tries to access `.data.data` (expecting a nested `data` property). This means `.data` is an array and `.data.data` is `undefined`, so calling `.filter()` on it throws "Cannot read properties of undefined".

**Crash 3 -- Line 61: `new Date(booking.endDate)`**
The `endDate` value comes through correctly from the mapping, but other fields like `booking.cabinId?.name`, `booking.seatId?.number` will show as undefined since the mapped object uses flat `cabinName` and `seatNumber` instead.

### Fix Plan

**File: `src/components/booking/BookingTransactionView.tsx`**

1. **Fix the transaction fetch** (line 74): Change `transactionsResponse.data.data.filter(...)` to `transactionsResponse.data.filter(...)` since `getUserTransactions` returns a flat array, not a nested object.

2. **Fix `seatPrice` crash** (line 174): Add optional chaining -- `booking.seatPrice?.toLocaleString()` with a fallback to `booking.totalPrice?.toLocaleString() || '0'`. This ensures the page renders even when `seatPrice` is not present.

3. **Fix booking field access throughout the component**: The component references `booking.cabinId?.name`, `booking.seatId?.number`, `booking.hostelId?.name`, `booking.bedId?.number` -- these don't exist on the student's mapped object. Add fallbacks:
   - `booking.cabinId?.name || booking.cabinName || 'N/A'`
   - `booking.seatId?.number || booking.seatNumber || 'N/A'`

4. **Guard the `endDate` usage** (line 61): Wrap in a try-catch or check validity before creating a Date object.

5. **Guard optional rendering**: Add null checks on `booking.originalPrice`, `booking.appliedCoupon`, `booking.transferredHistory` to prevent rendering errors when these are absent.

### Summary

| Bug | Location | Fix |
|---|---|---|
| `seatPrice` undefined crash | Line 174 | Optional chaining + fallback to `totalPrice` |
| `data.data.filter` undefined | Line 74 | Use `data.filter` directly (flat array) |
| Missing `cabinId.name` etc. | Lines 163-169 | Add fallbacks to flat field names |
| Missing guard on optional fields | Lines 179-205 | Add null checks |

Only one file needs editing: `src/components/booking/BookingTransactionView.tsx`

