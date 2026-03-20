

## Fix: Financial Splits Not Working (Missing FK Joins)

### Root Cause
The PostgREST joins `bookings(locker_included, locker_price, total_price)` and `hostel_bookings:booking_id(security_deposit, total_price)` **silently fail** because there are no foreign key constraints from `receipts.booking_id → bookings.id` or `hostel_receipts.booking_id → hostel_bookings.id`. The joined fields return `null`, so the split logic always falls through to the else branch — counting 100% of every receipt as seat/bed fees, with ₹0 for locker and security deposit. This affects **all periods** (current, previous, and 12-month trends).

### Fix — Manual JS Join

**File: `src/hooks/usePartnerPerformance.ts`**

1. **Add two new queries** to fetch booking locker/security data:
   - RR bookings: `bookings.select('id, locker_included, locker_price, total_price').in('cabin_id', filteredCabinIds)`
   - Hostel bookings: `hostel_bookings.select('id, security_deposit, total_price').in('hostel_id', filteredHostelIds)`

2. **Build lookup maps** from these results:
   - `rrBookingMap: Map<bookingId, {locker_included, locker_price, total_price}>`
   - `hBookingMap: Map<bookingId, {security_deposit, total_price}>`

3. **Update `splitRRReceipts`** to accept the lookup map and use `rrBookingMap.get(r.booking_id)` instead of `r.bookings`

4. **Update `splitHostelReceipts`** similarly to use `hBookingMap.get(r.booking_id)` instead of `r.hostel_bookings`

5. **Revert receipt queries** (indices 4-7) to remove the non-working PostgREST joins, but **add `booking_id`** to the select so we can do the manual join

6. **Update 12-month trend queries** (indices 11-12) to also include `booking_id` and apply the same split logic for deposit tracking in the monthly trend chart

This ensures all historical/backdated data is correctly split across all date filters.

