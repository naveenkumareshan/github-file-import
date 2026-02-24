

## Booking Card Address, Pricing Display, and Locker Controls

### What Will Change

**1. Show Reading Room address on booking cards (up to 10-15 words)**
Currently the booking card tries to access `cabinId?.location?.fullAddress` which doesn't exist in the database. We'll add a `full_address` column to the `cabins` table and display a truncated address (max ~15 words) on each booking card.

**2. Show Seat Amount and Locker Amount side by side on booking cards**
The current card shows "Seat: Rs X" alone. We'll display both "Seat: Rs X" and "Locker: Rs Y" side by side when locker is applicable.

**3. Add Locker Available toggle + Locker Price + Starting Price to Reading Room creation**
- Add `locker_available` (boolean) and `locker_price` (numeric) columns to the `cabins` database table
- Add a `full_address` (text) column to the `cabins` table
- The CabinEditor already has locker UI controls -- we'll wire them to the database
- Rename the "Monthly Price" field label to "Starting Price" to clarify it's the base/starting price for seat categories
- Locker availability is per reading room -- admin/partner decides if lockers are offered and at what price

---

### Technical Details

#### Database Migration

Add three new columns to the `cabins` table:

```text
ALTER TABLE cabins ADD COLUMN locker_available boolean NOT NULL DEFAULT false;
ALTER TABLE cabins ADD COLUMN locker_price numeric NOT NULL DEFAULT 0;
ALTER TABLE cabins ADD COLUMN full_address text DEFAULT '';
```

#### File Changes

**`src/api/bookingsService.ts`**
- Update all `cabins(...)` select strings to include `full_address, locker_available, locker_price`
- Queries: `getUserBookings`, `getCurrentBookings`, `getBookingById`, `getBookingHistory`

**`src/pages/StudentBookings.tsx`**
- In `mapBooking`, pass the cabin's `full_address` and `locker_price` into the booking display object

**`src/components/booking/BookingsList.tsx`**
- Add `lockerPrice` and `cabinAddress` to the `BookingDisplay` interface
- Show truncated address (max 15 words) under the seat number line
- Show "Seat: Rs X" and "Locker: Rs Y" side by side in the extra info chips section

**`src/pages/BookSeat.tsx`**
- Read `locker_price` from the cabin data instead of hardcoding 500

**`src/components/admin/CabinEditor.tsx`**
- Rename "Monthly Price" label to "Starting Price" with helper text: "This is the starting base price shown to students. Actual seat prices are set via categories."
- The locker toggle and price fields already exist -- no UI changes needed there
- Ensure `lockerAvailable`, `lockerPrice`, and `fullAddress` are saved to and loaded from the database

**`src/pages/RoomManagement.tsx`**
- Ensure cabin save/update passes `locker_available`, `locker_price`, and `full_address` to the database

**`src/api/adminCabinsService.ts`** (or equivalent cabin CRUD service)
- Include the new columns when creating/updating cabins
