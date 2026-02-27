

## Rewire Hostel Pages to Cloud Database

### Problem Summary

Three pages and two edge functions still reference legacy MongoDB patterns or missing service methods. This plan rewires them to the cloud database with advance payment and Razorpay support.

---

### 1. AddRoomWithSharingForm -- Use hostelRoomService.createRoom()

**File**: `src/components/admin/AddRoomWithSharingForm.tsx`

Currently calls `hostelService.addRoom(hostelId, roomData)` which does not exist. Rewire to `hostelRoomService.createRoom()`.

Changes:
- Import `hostelRoomService` instead of `hostelService`
- Map form fields to cloud DB schema:
  - `roomNumber` -> `room_number`
  - `floor` -> `floor` (parse to integer)
  - `imageSrc` -> `image_url`
  - `images` -> `images`
  - `isActive` -> `is_active`
  - `amenities` -> `amenities`
- Map each sharing option:
  - `type` -> `type`
  - `capacity` -> `capacity`
  - `count` -> `total_beds`
  - `price` -> `price_monthly` (also set `price_daily = price / 30`)
- Call `hostelRoomService.createRoom(hostelId, roomData, sharingOptions)`

---

### 2. HostelRoomDetails -- Rewire to Cloud DB

**File**: `src/pages/HostelRoomDetails.tsx`

Currently fetches hostel by `roomId` using `hostelService.getHostelById(roomId)` and accesses legacy fields (`_id`, `hostelId`, `option.available`, `option.count`). Needs full rewire.

Changes:
- Route parameter is the hostel ID (not room ID). Rename param usage accordingly
- Fetch hostel with `hostelService.getHostelById(hostelId)` -- returns cloud data directly (no `.success` wrapper)
- Fetch rooms with `hostelRoomService.getHostelRooms(hostelId)` -- returns rooms with nested `hostel_sharing_options` and `hostel_beds`
- Replace legacy field access:
  - `room._id` -> `room.id`
  - `room.imageSrc` -> `room.image_url`
  - `option.price` -> `option.price_monthly`
  - `option.count * option.capacity` -> `option.total_beds`
  - `option.available` -> computed from `option.hostel_beds.filter(b => b.is_available).length`
  - `hostel._id` -> `hostel.id`
  - `hostel.logoImage` -> `hostel.logo_image`
- Update "Book Now" navigation to pass cloud-schema data:
  - `navigate('/hostel-booking/${hostel.id}/${room.id}', { state: { room, hostel, sharingOption } })`
- Sharing option selection cards use computed `available` count from beds

---

### 3. HostelBooking -- Full Rewire with Advance Payment

**File**: `src/pages/HostelBooking.tsx`

Currently uses legacy `hostelService.bookSharedRoom()` and `bookSharedRoomUpdateTransactioId()`. Rewire to `hostelBookingService.createBooking()` with advance payment logic.

Changes:
- Replace legacy field access: `hostel._id` -> `hostel.id`, `room._id` -> `room.id`, `sharingOption._id` -> `sharingOption.id`
- Use `sharingOption.price_monthly` for monthly pricing, `sharingOption.price_daily` for daily
- Calculate price using the correct price field based on duration type:
  - Daily: `price_daily * duration`
  - Weekly: `price_daily * 7 * duration`
  - Monthly: `price_monthly * duration`
- Add advance payment calculation:
  - Read `hostel.advance_booking_enabled`, `hostel.advance_percentage`, `hostel.advance_flat_amount`, `hostel.advance_use_flat`
  - If advance enabled: calculate advance amount, show breakdown in payment summary
  - Pay only advance amount via Razorpay, set `remaining_amount` on booking
- Booking flow:
  1. Get available beds via `hostelBookingService.getAvailableBeds(room.id, startDate, endDate)`
  2. Auto-select first available bed for the chosen sharing option
  3. Create booking via `hostelBookingService.createBooking(data)` -- this returns the booking with `id`
  4. Create Razorpay order with the advance amount (or full amount)
  5. Update booking with `razorpay_order_id`
  6. Open Razorpay checkout
  7. On success: update booking with payment details
- Add security deposit display if `hostel.security_deposit > 0`
- Show advance payment breakdown in the Payment Summary card

---

### 4. Edge Functions -- Support hostel_bookings Table

**File**: `supabase/functions/razorpay-create-order/index.ts`

Currently only updates `bookings` table (line 102-105). Add `bookingType` routing:
- If `bookingType === 'hostel'`: update `hostel_bookings` table instead of `bookings`
- Otherwise: keep existing `bookings` table update

**File**: `supabase/functions/razorpay-verify-payment/index.ts`

Currently only updates `bookings` table (lines 53-56 for test mode, 108-116 for real mode). Add `bookingType` routing:
- Accept `bookingType` from request body
- If `bookingType === 'hostel'`: update `hostel_bookings` table
- Otherwise: keep existing `bookings` table update
- For hostel bookings, also create a `hostel_receipts` entry on successful verification

---

### 5. HostelConfirmation -- Fix Service Call

**File**: `src/pages/HostelConfirmation.tsx`

Currently calls `hostelService.getBookingById(bookingId)` expecting `response.success` wrapper, but the rewritten service throws on error and returns data directly.

Changes:
- Use `hostelBookingService.getBookingById(bookingId)` instead
- Remove `.success` and `.data` wrapper -- data is returned directly
- Map cloud DB fields to display:
  - `booking.hostels.name` instead of legacy field names
  - `booking.hostel_rooms.room_number`
  - `booking.hostel_beds.bed_number`

---

### Files Changed

| File | Change |
|------|--------|
| `src/components/admin/AddRoomWithSharingForm.tsx` | Use `hostelRoomService.createRoom()`, map fields to cloud schema |
| `src/pages/HostelRoomDetails.tsx` | Fetch from cloud DB, compute bed availability, use cloud field names |
| `src/pages/HostelBooking.tsx` | Use `hostelBookingService`, add advance payment logic, fix field names |
| `src/pages/HostelConfirmation.tsx` | Use `hostelBookingService.getBookingById()`, remove response wrapper |
| `supabase/functions/razorpay-create-order/index.ts` | Route to `hostel_bookings` table when `bookingType === 'hostel'` |
| `supabase/functions/razorpay-verify-payment/index.ts` | Route to `hostel_bookings` table + create receipt when `bookingType === 'hostel'` |

