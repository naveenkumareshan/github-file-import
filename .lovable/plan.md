

## Seat Control Center Enhancements

Six improvements to the Seat Control Center page and its backing service.

---

### 1. Move Price Edit Button Inline (beside price)

Currently the price edit button only appears on hover overlay (grid) or in a separate Actions column (table). 

**Change**: In the grid view, show a tiny pencil icon right next to the price text inside each seat box (always visible, no hover needed). In the table view, move the edit icon inline with the price cell instead of a separate Actions column entry.

**File: `src/pages/vendor/VendorSeats.tsx`**
- Grid: Replace the `<span>` showing price with a flex row: `₹{price}` + tiny edit icon button (h-3 w-3). Clicking it opens the price edit dialog (stopPropagation).
- Table: In the Price cell, add the edit button inline after the price text.
- Remove the edit button from the hover overlay (grid) and Actions column (table) since it is now beside the price.

---

### 2. Remove "End Date" Column from Table View

The "End Date" column is confusing in a date-aware dashboard because the grid already shows status per selected date.

**Change**: Remove the "End Date" column header and cell from the table view entirely. Booking end dates are already visible in the right-side Sheet drawer under booking details.

**File: `src/pages/vendor/VendorSeats.tsx`**
- Remove `<TableHead>End Date</TableHead>` and corresponding `<TableCell>`.

---

### 3. Add "All Rooms" Option to Reading Room Dropdown

Currently partners must select a single reading room. There is no option to see all seats across all rooms.

**Change**: Add an "All Rooms" option at the top of the Select dropdown. When selected, fetch seats for ALL cabins (loop through all cabin IDs and merge results, or pass no cabin filter).

**File: `src/api/vendorSeatsService.ts`**
- Update `getSeatsForDate` to accept `cabinId = 'all'` -- in that case, query all seats without the `.eq('cabin_id', ...)` filter.

**File: `src/pages/vendor/VendorSeats.tsx`**
- Add `<SelectItem value="all">All Reading Rooms</SelectItem>` as the first option.
- Default to `'all'` instead of first cabin.

---

### 4. Seat Block/Unblock with Remarks and History

Currently blocking/unblocking a seat has no audit trail. Partners need to record why a seat was blocked.

**Database Migration**: Create a `seat_block_history` table:

```text
CREATE TABLE public.seat_block_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seat_id uuid NOT NULL REFERENCES public.seats(id) ON DELETE CASCADE,
  action text NOT NULL, -- 'blocked' or 'unblocked'
  reason text NOT NULL DEFAULT '',
  performed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seat_block_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage block history" ON public.seat_block_history
FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Vendors can manage block history for own seats" ON public.seat_block_history
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM seats s JOIN cabins c ON s.cabin_id = c.id
  WHERE s.id = seat_block_history.seat_id AND c.created_by = auth.uid()
));
```

**File: `src/api/vendorSeatsService.ts`**
- Update `toggleSeatAvailability` to accept a `reason` string parameter.
- After toggling, insert a row into `seat_block_history` with action, reason, and `auth.uid()`.
- Add `getSeatBlockHistory(seatId)` method to fetch history for a seat.

**File: `src/pages/vendor/VendorSeats.tsx`**
- When clicking block/unblock, show a small dialog asking for a reason/remark (required text input).
- On confirm, call the updated `toggleSeatAvailability` with the reason.
- In the Sheet drawer (for blocked seats), show block history (reason, date, who blocked).

---

### 5. Add "Details" Button on Each Seat

Currently the only way to see booking details is by clicking the seat to open the Sheet. There is no explicit "Details" button.

**Change**: Add a small "Details" or info icon button on each seat (grid hover overlay and table Actions column). It opens the same Sheet drawer but ensures the full booking info (current + future) is visible.

**File: `src/pages/vendor/VendorSeats.tsx`**
- Grid: Add an `Info` icon button to the hover overlay alongside the block button.
- Table: Add an `Info` icon button in the Actions column.
- Both call `handleSeatClick(seat)` to open the Sheet.
- In the Sheet, clearly separate "Current Booking" and "Future Bookings" sections. Future bookings are those where `startDate > selectedDate`.

---

### 6. "Create New Student" Option in Booking Form + Locker Toggle

Currently partners can only search existing students. They need the ability to create a new student inline and also choose whether to include a locker.

**File: `src/api/vendorSeatsService.ts`**
- Add `createStudentAndBook` method:
  1. Call Supabase Auth `admin.createUser` via an edge function (since client can't create users for others).
  2. The `handle_new_user` trigger auto-creates the profile and assigns the 'student' role.
  3. Update the profile with name, phone, email.
  4. Then call `createPartnerBooking` with the new user's ID.
- Update `PartnerBookingData` interface to include optional `lockerIncluded: boolean` and `lockerPrice: number`.
- In `createPartnerBooking`, if locker is included, add locker price to total and store it (we can add a `locker_included` boolean column to bookings).

**Database Migration**: 
```text
ALTER TABLE public.bookings ADD COLUMN locker_included boolean NOT NULL DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN locker_price numeric NOT NULL DEFAULT 0;
```

**Edge Function: `create-student`**
- Accepts `{ name, phone, email }`.
- Uses service role to create a user in auth with a random password and auto-confirm.
- Returns the new user ID.
- The existing `handle_new_user` trigger will auto-create the profile entry.

**File: `src/pages/vendor/VendorSeats.tsx`**
- Below the student search, add a "Create New Student" expandable section with fields: Name, Phone, Email.
- On "Create & Select", call the edge function, then auto-select the new student.
- Add a "Include Locker" checkbox below the plan selection (only if the cabin has `locker_available = true`). Show the locker price. If checked, add it to the booking amount.
- Fetch cabin's locker settings when a cabin is selected (already have cabin data).
- Show locker price in the booking summary before confirm.

**File: `src/api/vendorSeatsService.ts`**
- Update `getVendorCabins` to also return `lockerAvailable`, `lockerPrice`, `lockerMandatory` from the cabins table.
- Update `VendorCabin` interface accordingly.

---

### Summary of All Changes

| Area | File(s) | Change |
|------|---------|--------|
| Price edit inline | `VendorSeats.tsx` | Move edit icon beside price in grid and table |
| Remove End Date | `VendorSeats.tsx` | Remove confusing End Date column from table |
| All Rooms filter | `VendorSeats.tsx`, `vendorSeatsService.ts` | Add "All Rooms" option to dropdown |
| Block history | DB migration, `vendorSeatsService.ts`, `VendorSeats.tsx` | New `seat_block_history` table, reason dialog, history display |
| Details button | `VendorSeats.tsx` | Add Info icon to grid/table, split current/future bookings in Sheet |
| Create student | Edge function `create-student`, `vendorSeatsService.ts`, `VendorSeats.tsx` | Inline student creation form, locker toggle, booking columns |
| Locker in booking | DB migration, `VendorSeats.tsx` | Add `locker_included` and `locker_price` to bookings table |

