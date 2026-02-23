

## Fix Reading Room System + Booking Flow + Razorpay Integration

### Root Cause Analysis

After auditing the entire codebase, here are the **root causes** of all failures:

| Issue | Root Cause |
|---|---|
| SeatManagement crashes | `floors` column doesn't exist in `cabins` table; `adminSeatsService` calls localhost:5000 via axios |
| AdminStudents crashes | `includeInactive` and `loadingBookings` variables used but never declared |
| Student can't see rooms | `Cabins.tsx` maps `cabin._id` / `cabin.isActive` / `cabin.imageUrl` but Supabase returns `id` / `is_active` / `image_url` |
| Seats don't work | No `seats` table exists in the database; both `seatsService` and `adminSeatsService` call localhost:5000 |
| Booking flow breaks at payment | `transactionService`, `razorpayService`, `adminUsersService` all call localhost:5000 via axios |
| Razorpay doesn't work | Order creation and payment verification hit Express backend which isn't running |

### Implementation Plan

---

#### Phase 1: Fix Immediate Build Crashes

**File: `src/pages/AdminStudents.tsx`**
- Add missing `useState` declarations for `includeInactive` (boolean, default `false`) and `loadingBookings` (boolean, default `false`)
- These are referenced throughout the component but were never declared

---

#### Phase 2: Create `seats` Table in Database

Create a new migration with a `seats` table that mirrors the MongoDB Seat model:

```text
seats table:
- id (uuid, primary key)
- number (integer, required)
- floor (integer, default 1)
- cabin_id (uuid, references cabins.id)
- is_available (boolean, default true)
- price (numeric, required)
- position_x (numeric, required)
- position_y (numeric, required)
- is_hot_selling (boolean, default false)
- unavailable_until (timestamptz, nullable)
- sharing_type (text, default 'private')
- sharing_capacity (integer, default 4)
- created_at (timestamptz)
```

RLS policies:
- Public can view seats for active cabins (SELECT)
- Admins can manage all seats (ALL)

Index on `cabin_id` for fast lookups.

---

#### Phase 3: Add `floors` Column to `cabins` Table

Add a `floors` JSONB column (default `'[]'`) to the cabins table so floor management works without a separate table.

---

#### Phase 4: Rewrite Seat Services to Use Cloud Database

**File: `src/api/adminSeatsService.ts`** -- Complete rewrite from axios to Supabase SDK

All methods will query the new `seats` table directly:
- `getSeatsByCabin(cabinId, floor)` -- filter by `cabin_id` and `floor`
- `createSeat / bulkCreateSeats` -- insert into `seats` table
- `updateSeat / bulkUpdateSeats` -- update by id
- `deleteSeat` -- delete by id
- `updateSeatPositions` -- bulk update positions

**File: `src/api/seatsService.ts`** -- Complete rewrite from axios to Supabase SDK

Student-facing seat queries:
- `getSeatsByCabin(cabinId, floor)` -- public read
- `getAvailableSeatsForDateRange(cabinId, floor, startDate, endDate)` -- check against bookings table for conflicts
- `checkSeatAvailability` / `checkSeatsAvailabilityBulk` -- cross-reference with bookings

---

#### Phase 5: Fix Student-Facing Room Display

**File: `src/pages/Cabins.tsx`**
- Fix field mapping: `cabin._id` to `cabin.id`, `cabin.isActive` to `cabin.is_active`, `cabin.imageUrl` to `cabin.image_url`
- The `cabinsService` already returns Supabase data, but this page transforms it using old MongoDB field names

**File: `src/components/search/CabinSearchResults.tsx`**
- Fix `cabin._id` references to use `cabin.id`
- Fix `cabin.imageSrc` to use `cabin.image_url`
- Handle missing `location` object gracefully (show city/area from flat columns instead)

**File: `src/pages/BookSeat.tsx`**
- Already partially fixed but `floors` is hardcoded to `[]`; read from cabin's new `floors` JSONB column

---

#### Phase 6: Fix SeatManagement Admin Page

**File: `src/pages/SeatManagement.tsx`**
- Fix `floors` handling: read from `cabinResponse.data.floors` (JSONB) with fallback to `[]`
- Fix `cabin._id` references to use `cabin.id` (Supabase uses `id`)
- Fix `cabin.isActive` to `cabin.is_active`
- `addUpdateCabinFloor` will update the `floors` JSONB column via `adminCabinsService`
- Fix `handleSeatSelect` null safety (line 182: `selectedSeat.price` when `selectedSeat` may be null)

**File: `src/api/adminCabinsService.ts`**
- Implement `addUpdateCabinFloor` to actually update the `floors` JSONB column
- Implement `updateCabinLayout` to store room elements (add `room_elements` JSONB column)

---

#### Phase 7: Rewrite AdminUsersService to Use Cloud Database

**File: `src/api/adminUsersService.ts`** -- Complete rewrite from axios to Supabase SDK

- `getUsers(filters)` -- query `profiles` table joined with `user_roles`, with pagination and search
- `getUserById(userId)` -- query single profile
- `updateUser(userId, data)` -- update profile
- `getBookingsByUserId(filters)` -- query `bookings` table filtered by user_id

---

#### Phase 8: Razorpay Payment Integration via Edge Functions

Since Razorpay order creation and verification require server-side secret keys, we need edge functions.

**New edge function: `supabase/functions/razorpay-create-order/index.ts`**
- Accepts `{ amount, currency, bookingId, bookingType }` 
- Creates Razorpay order using server-side key
- Returns order object with `id`, `amount`, `currency`, `KEY_ID`
- Requires `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` secrets

**New edge function: `supabase/functions/razorpay-verify-payment/index.ts`**
- Accepts `{ razorpay_payment_id, razorpay_order_id, razorpay_signature, bookingId }`
- Verifies HMAC signature using `RAZORPAY_KEY_SECRET`
- On success: updates booking `payment_status` to `completed`
- Returns verification result

**File: `src/api/razorpayService.ts`** -- Rewrite to use edge functions
- `createOrder` calls `supabase.functions.invoke('razorpay-create-order')`
- `verifyPayment` calls `supabase.functions.invoke('razorpay-verify-payment')`

**File: `src/api/transactionService.ts`** -- Rewrite to use Supabase
- Create a `transactions` table in the database
- Or simplify: store payment info directly on the `bookings` table (add `razorpay_order_id`, `razorpay_payment_id` columns)

**File: `src/components/payment/RazorpayCheckout.tsx`**
- Update to use the new edge-function-based `razorpayService`
- Remove dependency on `transactionService` axios calls
- Simplify flow: create booking (already done) -> create Razorpay order (edge function) -> verify payment (edge function) -> update booking status

---

#### Phase 9: Add `room_elements` Column to `cabins` Table

Add a `room_elements` JSONB column (default `'[]'`) so room layout elements persist.

---

### Database Migration Summary

New migration adds:
1. `seats` table with RLS policies and index
2. `floors` JSONB column to `cabins` table (default `'[]'`)
3. `room_elements` JSONB column to `cabins` table (default `'[]'`)
4. Payment-related columns to `bookings` table: `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`

### Secret Requirements

Before Razorpay works, two secrets must be configured:
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

### Files Modified/Created Summary

| File | Action |
|---|---|
| `src/pages/AdminStudents.tsx` | Fix: add missing state variables |
| `src/pages/Cabins.tsx` | Fix: field name mapping |
| `src/pages/BookSeat.tsx` | Fix: floors from JSONB |
| `src/pages/SeatManagement.tsx` | Fix: id mapping, floors, null safety |
| `src/api/adminSeatsService.ts` | Rewrite: axios to Supabase |
| `src/api/seatsService.ts` | Rewrite: axios to Supabase |
| `src/api/adminUsersService.ts` | Rewrite: axios to Supabase |
| `src/api/adminCabinsService.ts` | Fix: implement floor/layout methods |
| `src/api/razorpayService.ts` | Rewrite: axios to edge functions |
| `src/api/transactionService.ts` | Rewrite: axios to Supabase |
| `src/components/payment/RazorpayCheckout.tsx` | Fix: use new services |
| `src/components/search/CabinSearchResults.tsx` | Fix: field mapping |
| `supabase/functions/razorpay-create-order/index.ts` | New: edge function |
| `supabase/functions/razorpay-verify-payment/index.ts` | New: edge function |
| Database migration | New: seats table, cabins columns, booking columns |

### What This Does NOT Change

- The Express backend code in `/backend/` remains untouched (not used)
- Hostel booking flow (separate system, not in scope)
- Laundry system
- Vendor/Partner management

