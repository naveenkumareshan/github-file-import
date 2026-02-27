

## Show Separate Amounts (Bed/Seat + Deposit/Locker) in All Booking Lists

### Problem
Currently, all booking lists show a single "Amount" figure (total_price). The user wants two amounts displayed:
1. **Bed/Seat Amount** (after discount)
2. **Security Deposit** (hostel) or **Locker Amount** (reading room)

### Changes

#### 1. Admin Hostel Bookings (`src/pages/hotelManager/AdminHostelBookings.tsx`)
- Update the query to also select `security_deposit, discount_amount` (if stored) from `hostel_bookings`
- Replace the single Amount cell (line 198) with two lines:
  - Bed: total_price (this is the bed amount after discount)
  - Deposit: security_deposit (if > 0)
- Show grand total (total_price + security_deposit) as a subtle sub-line

#### 2. Student Dashboard - Hostel Bookings (`src/pages/StudentDashboard.tsx`)
- The hostel booking cards (lines 119-122 and 485-488) currently show `total_price`
- Update to show bed amount and security deposit separately
- The `BookingData` interface needs `security_deposit` and `locker_price` fields added
- For reading room bookings fetched via `bookingsService`, the data should already include `locker_price` and `discount_amount` from the `bookings` table

#### 3. BookingsList Component (`src/components/booking/BookingsList.tsx`)
- The price display area (around line 206) shows `₹{booking.totalPrice.toLocaleString()}`
- Split into: Seat amount (totalPrice - lockerPrice) and Locker (lockerPrice)
- Use existing `booking.seatPrice` and `booking.lockerPrice` fields from the `BookingDisplay` interface (already defined but not displayed separately)

#### 4. Hostel Bed Details Dialog (`src/components/admin/HostelBedDetailsDialog.tsx`)
- Update the booking history table to show bed amount + deposit columns instead of single amount

### Visual Format (Amount Column)
```text
Hostel:                    Reading Room:
Bed: 4,500                 Seat: 3,500
Deposit: 5,000             Locker: 500
```

When deposit/locker is 0, only the bed/seat amount is shown (no second line).

### Technical Details

**Data availability:**
- `hostel_bookings` table has `total_price` (bed amount) and `security_deposit` columns -- both already queried
- `bookings` table has `total_price`, `locker_price`, `locker_included`, `discount_amount` columns
- The `BookingDisplay` interface in BookingsList already has `seatPrice` and `lockerPrice` fields

**Files to modify:**
1. `src/pages/hotelManager/AdminHostelBookings.tsx` -- Amount cell split
2. `src/pages/StudentDashboard.tsx` -- Interface + display updates for both booking types
3. `src/components/booking/BookingsList.tsx` -- Price display split
4. `src/components/admin/HostelBedDetailsDialog.tsx` -- Table amount column split

