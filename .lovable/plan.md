

## Fix Seat Map, Transactions, and Partner Ownership for Reading Rooms

This plan addresses three areas: making the Seat Map work with the database, fixing the transaction/bookings data flow, and adding partner ownership to every reading room.

---

### 1. Fix Seat Map (Seat Availability Map)

**Problem**: The `VendorSeats.tsx` page (Seat Map sidebar item) uses `vendorSeatsService` which calls `axios` to `localhost:5000` -- the old backend that no longer exists. This means the page loads but shows no data.

**Solution**: Rewrite `vendorSeatsService.ts` to use Supabase directly, similar to how `adminSeatsService.ts` already works.

**File: `src/api/vendorSeatsService.ts`** (full rewrite)
- `getVendorCabins()`: Query `cabins` table. For admin, return all cabins. For partner (vendor), filter by the new `created_by` column matching the logged-in user's ID.
- `getVendorSeats(filters)`: Query `seats` table, join with `cabins` for cabin name. Apply filters (cabinId, status). Also left-join `bookings` to show current booking info (student name, phone, email, dates) for occupied seats.
- `updateSeatPrice(seatId, price)`: Update `seats.price` via Supabase.
- `toggleSeatAvailability(seatId, isAvailable)`: Update `seats.is_available` via Supabase.
- `toggleHotSelling(seatId, isHotSelling)`: Update `seats.is_hot_selling` via Supabase.

**File: `src/pages/vendor/VendorSeats.tsx`**
- Update data mapping to match new Supabase column names (snake_case to camelCase).
- Fix the missing `handleToggleHotSelling` function (currently referenced but not defined, causing a runtime error).

---

### 2. Fix Transactions / Bookings Data

**Problem**: `adminBookingsService.ts` uses axios to `localhost:5000`. The admin bookings list page loads but gets no data from the backend.

**Solution**: Rewrite `adminBookingsService.ts` to query the Supabase `bookings` table directly, joining with `profiles` (for customer info), `cabins` (for room info), and `seats` (for seat number).

**File: `src/api/adminBookingsService.ts`** (full rewrite)
- `getAllBookings(filters)`: Query `bookings` with joins to `profiles`, `cabins`, `seats`. Support filters: status (payment_status), search, date range, sorting, pagination.
- `getBookingById(id)`: Single booking with related data.
- `updateBookingStatus(id, status)`: Update `bookings.payment_status`.
- `cancelBooking(id)`: Set payment_status to 'cancelled'.
- `getBookingStats()`: Aggregate counts by status.
- Remove old axios-based methods that won't work with current schema (occupancy, revenue, etc.) and replace with Supabase equivalents or stubs.

**File: `src/components/admin/AdminBookingsList.tsx`**
- Update the `Booking` interface and data mapping to match Supabase column names.
- Fix the data rendering to use the new joined data structure.

---

### 3. Partner Ownership for Reading Rooms

**Problem**: The `cabins` table has no column linking a reading room to a partner. When a partner logs in, they see all reading rooms instead of only theirs.

**Solution**: Add a `created_by` column (UUID) to `cabins` to track which user (admin or partner) created the room. Use this to filter reading rooms per partner.

#### Database Migration

```text
ALTER TABLE cabins ADD COLUMN created_by uuid REFERENCES auth.users(id);
```

Also add an RLS policy so partners can manage their own cabins:

```text
CREATE POLICY "Partners can manage own cabins"
ON public.cabins FOR ALL TO authenticated
USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'))
WITH CHECK (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));
```

#### Partner Details Tab in CabinEditor

**File: `src/components/admin/CabinEditor.tsx`**
- Add a new "Partner Details" tab between "Contact Person Details" and "Location".
- For **admin**: Show a dropdown to select an existing partner (from `profiles` + `user_roles` where role = 'vendor'), or default to the admin themselves.
- For **partner**: Auto-fill with their own details (name, email, phone from their profile). Read-only display.
- Fields in the tab: Partner Name, Partner Phone, Partner Email, Partner ID (serial number). These are pulled from the selected partner's profile.

**File: `src/api/adminCabinsService.ts`**
- In `createCabin()`: Set `created_by` to the current authenticated user's ID.
- In `updateCabin()`: Allow updating `created_by` only if the current user is admin.
- In `getAllCabins()`: For non-admin users, filter by `created_by = auth.uid()` (this will be handled by RLS automatically).

**File: `src/pages/RoomManagement.tsx`**
- Pass `created_by` into the save payload.
- For partners, the RLS policy will automatically filter to show only their own reading rooms.

---

### Summary of Changes

| Area | Files | Action |
|------|-------|--------|
| Seat Map | `src/api/vendorSeatsService.ts` | Rewrite from axios to Supabase |
| Seat Map | `src/pages/vendor/VendorSeats.tsx` | Fix data mapping and missing function |
| Transactions | `src/api/adminBookingsService.ts` | Rewrite from axios to Supabase |
| Transactions | `src/components/admin/AdminBookingsList.tsx` | Fix data mapping for Supabase structure |
| Partner Ownership | Database migration | Add `created_by` column + RLS policy |
| Partner Ownership | `src/components/admin/CabinEditor.tsx` | Add "Partner Details" tab |
| Partner Ownership | `src/api/adminCabinsService.ts` | Set `created_by` on create |
| Partner Ownership | `src/pages/RoomManagement.tsx` | Pass `created_by` in save |

