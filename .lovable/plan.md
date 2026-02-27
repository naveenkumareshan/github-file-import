

## 24/7 and Slot-Based Booking System

### Overview
Add a flexible timing model to Reading Rooms: partners/admins can configure rooms as either "24/7" (always open) or "scheduled" (with specific hours and working days). On top of that, introduce an optional slot-based booking model where rooms can define named time slots (e.g., "Morning Batch", "Evening Batch") with individual pricing, and students book a specific slot rather than the full day.

---

### 1. Database Changes

**a) Add `is_24_hours` and `slots_enabled` columns to `cabins` table:**

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `is_24_hours` | boolean | false | If true, room is open 24/7; timing fields hidden |
| `slots_enabled` | boolean | false | If true, slot-based booking is active for this room |

**b) Create `cabin_slots` table:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Auto-generated |
| `cabin_id` | uuid (FK to cabins) | Which reading room |
| `name` | text | Slot name (e.g., "Morning Batch") |
| `start_time` | time | Slot start (e.g., 06:00) |
| `end_time` | time | Slot end (e.g., 12:00) |
| `price` | numeric | Price for this slot per month |
| `is_active` | boolean | Whether slot is bookable |
| `created_at` | timestamptz | Auto |

RLS policies:
- Admins: full access
- Partners: full access on own cabin's slots (via cabins.created_by)
- Anyone: SELECT on active slots (for students to see)

**c) Add `slot_id` column to `bookings` table:**

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `slot_id` | uuid (nullable) | null | References cabin_slots.id; null = full-day booking |

---

### 2. Admin/Partner CabinForm Updates (`CabinForm.tsx`)

- Add **"24/7 Open"** toggle (Switch component) at the top of the Timings section
- When `is_24_hours` is ON:
  - Hide opening time, closing time, and working days fields
  - Show "This room is open 24 hours, 7 days a week" info text
- When OFF:
  - Show current timing fields (opening/closing time, working days) as-is
- Add **"Enable Slot-Based Booking"** toggle below the timing section
  - Only visible when the room is NOT 24/7 (slots make sense for scheduled rooms), OR also for 24/7 rooms if the partner wants to split the day into paid batches
- Update Zod schema: make `openingTime`/`closingTime`/`workingDays` conditionally required (only when `is_24_hours` is false)
- Map `is_24_hours` and `slots_enabled` through `adminCabinsService`

---

### 3. Slot Management Module (New Component)

**New file: `src/components/admin/SlotManagement.tsx`**

- Displayed inside the cabin editor (when `slots_enabled` is true)
- CRUD interface for slots:
  - Add Slot: name, start time, end time, price
  - Edit inline
  - Delete with confirmation
  - Toggle active/inactive
- Uses a new `src/api/cabinSlotService.ts` for all Supabase operations on `cabin_slots`

---

### 4. Booking Flow Updates (`SeatBookingForm.tsx`)

- After duration selection (Step 1), if `cabin.slots_enabled` is true and slots exist:
  - Show a **"Select Slot"** step with slot cards (name, time range, price)
  - Student must pick a slot before seeing the seat map
  - Seat price is overridden by the slot price
  - Selected slot is stored and passed to `bookingsService.createBooking` as `slot_id`
- If `slots_enabled` is false: current flow unchanged (full-day model)
- Seat availability check: when slot-based, query bookings that match the same `slot_id` + date range to determine conflicts (a seat booked for "Morning" slot is still available for "Evening" slot)

---

### 5. Seat Availability Logic Updates (`seatsService.ts`)

- Update `getAvailableSeatsForDateRange` to accept an optional `slotId` parameter
- When `slotId` is provided, only check for conflicting bookings with the same `slot_id`
- When `slotId` is null/undefined, check all bookings (full-day model, as currently works)
- Similarly update `checkSeatAvailability` and `checkSeatsAvailabilityBulk`

---

### 6. Display Updates

**a) CabinCard.tsx (Student Listing)**
- If `is_24_hours`: show badge "Open 24/7" (green accent) instead of timing line
- If not 24/7: show current timing display as-is
- If `slots_enabled`: show small "Slot Booking" badge

**b) BookSeat.tsx (Room Detail Page)**
- Add "Open 24/7" chip in the info chips row if applicable
- If slots enabled, show available slots in the details section

**c) StudentBookingView.tsx (Booking Details)**
- If booking has a `slot_id`, fetch and display slot name + times
- Show "Full Day" if no slot

**d) Partner Dashboard**
- Show 24/7 badge or timing info on room cards
- Show slot count if slots are enabled

---

### 7. Service Layer

**New file: `src/api/cabinSlotService.ts`**
- `getSlotsByCabin(cabinId)` -- fetch active slots for a cabin
- `getAllSlotsByCabin(cabinId)` -- fetch all slots (admin view)
- `createSlot(data)` -- insert new slot
- `updateSlot(id, data)` -- update slot
- `deleteSlot(id)` -- delete slot
- `toggleSlotActive(id, isActive)` -- enable/disable

**Update: `src/api/adminCabinsService.ts`**
- Map `is24Hours` to `is_24_hours` and `slotsEnabled` to `slots_enabled` in create/update

**Update: `src/api/cabinsService.ts`**
- Include new fields in queries

**Update: `src/api/bookingsService.ts`**
- Accept optional `slot_id` in `createBooking`
- Include slot info in booking queries

---

### 8. Files Summary

**New files:**
- `src/api/cabinSlotService.ts`
- `src/components/admin/SlotManagement.tsx`

**Modified files:**
- Database migration (add columns + new table)
- `src/components/admin/CabinForm.tsx` -- 24/7 toggle, slots toggle, conditional timing fields
- `src/api/adminCabinsService.ts` -- map new fields
- `src/api/cabinsService.ts` -- include new fields
- `src/api/bookingsService.ts` -- slot_id support
- `src/api/seatsService.ts` -- slot-aware availability
- `src/components/seats/SeatBookingForm.tsx` -- slot selection step
- `src/components/CabinCard.tsx` -- 24/7 badge, slot badge
- `src/pages/BookSeat.tsx` -- extend Cabin interface, display 24/7 chip
- `src/pages/students/StudentBookingView.tsx` -- show slot info
- `src/utils/timingUtils.ts` -- add `is24HoursDisplay()` helper
- `src/integrations/supabase/types.ts` -- auto-updated after migration

