

## 1. Compact 2x2 Grid Layout for Amount Column

Replace the vertical stack in both reading room and hostel booking tables with a CSS grid layout:

```text
Current (vertical):        New (2x2 grid):
Seat: 2,000               Seat: 2,000  | Locker: 300
Locker: 300                Paid: 2,300  | Due: 0
Paid: 2,300
Due: 0
```

### Files to change

**`src/pages/AdminBookings.tsx`** (lines 167-174) -- Reading Room Amount cell:
- Wrap in `grid grid-cols-2 gap-x-3 gap-y-0.5` container
- Col 1 row 1: Seat price
- Col 2 row 1: Locker price (show "Locker: -" if 0, to keep grid consistent)
- Col 1 row 2: Paid (green)
- Col 2 row 2: Due (amber)

**`src/pages/hotelManager/AdminHostelBookings.tsx`** (lines 227-234) -- Hostel Amount cell:
- Same 2x2 grid layout
- Col 1 row 1: Bed price
- Col 2 row 1: Deposit
- Col 1 row 2: Paid (green)
- Col 2 row 2: Due (amber)

---

## 2. Fix Reading Room Paid/Due Calculation

### Current Problem
In `src/api/adminBookingsService.ts` (lines 95-106), the calculation logic has these issues:
- When dues record exists: `totalPaid = advance_paid + paid_amount` -- correct
- When no dues + `completed`: `totalPaid = total_price` -- correct
- When no dues + `advance_paid`: `totalPaid = 0, duePending = 0` -- **WRONG** (should show what was actually paid)
- When no dues + other status: `totalPaid = 0, duePending = 0` -- may be wrong

### Fix
Also fetch receipts total per booking as a fallback. Update the query to also join receipts (aggregated), then:

**Calculation logic:**
- If dues record exists: `totalPaid = advance_paid + paid_amount`, `duePending = due_amount - paid_amount`
- If no dues but receipts exist: `totalPaid = receipts total`, `duePending = total_price - receipts total`
- If no dues, no receipts, `completed`: `totalPaid = total_price`, `duePending = 0`
- If no dues, no receipts, other: `totalPaid = 0`, `duePending = total_price`

### Implementation
**`src/api/adminBookingsService.ts`**:
- After fetching bookings, do a second query to get `SELECT booking_id, SUM(amount) as total_paid FROM receipts WHERE booking_id IN (...) GROUP BY booking_id`
- Build a receipts map and use it in the fallback calculation when no dues record exists

### Files changed: 3
- `src/api/adminBookingsService.ts` -- fix paid/due calculation with receipts fallback
- `src/pages/AdminBookings.tsx` -- 2x2 grid layout for Amount
- `src/pages/hotelManager/AdminHostelBookings.tsx` -- 2x2 grid layout for Amount

