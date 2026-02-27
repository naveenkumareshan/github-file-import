

## Full Implementation Plan: Partner Fix, Location System, and Slot Booking

This is a large, multi-phase implementation covering all three issues plus the enhancements you approved.

---

### Phase 1: Database Migrations

**Migration 1 -- user_roles RLS fix (Partner Assignment)**
- Add RLS SELECT policy for admins: `has_role(auth.uid(), 'admin')` -- fixes the partner dropdown returning empty
- Add RLS SELECT policy for vendors: `has_role(auth.uid(), 'vendor')` -- enables partner features
- Add index on `user_roles(user_id, role)` for `has_role()` performance
- Keep existing policies (own-role read, service role manage) unchanged
- Vendors get SELECT only -- no INSERT/UPDATE/DELETE escalation

**Migration 2 -- Location tables**
- Create `states` table: id (uuid PK), name (text UNIQUE NOT NULL), code (text), is_active (boolean default true), created_at
- Create `cities` table: id (uuid PK), name (text NOT NULL), state_id (uuid FK to states NOT NULL), latitude (numeric), longitude (numeric), is_active (boolean default true), created_at
  - UNIQUE constraint on (name, state_id)
  - Index on state_id
- Create `areas` table: id (uuid PK), name (text NOT NULL), city_id (uuid FK to cities NOT NULL), pincode (text), latitude (numeric), longitude (numeric), is_active (boolean default true), created_at
  - UNIQUE constraint on (name, city_id)
  - Indexes on city_id and pincode
- RLS policies:
  - Public SELECT for active records (`is_active = true`)
  - Admin ALL access via `has_role(auth.uid(), 'admin')`
  - Vendor SELECT for active records

**Migration 3 -- Seed Indian states and major cities**
- Insert all 28 Indian states + 8 UTs with codes
- Insert top cities per state (50-100 entries)

**Migration 4 -- Slot overlap prevention trigger**
- Create a validation trigger `validate_slot_no_overlap` on `cabin_slots` BEFORE INSERT/UPDATE
- Checks that no existing active slot in the same cabin has overlapping time range
- Raises exception if overlap detected

---

### Phase 2: Location System Rewrite (5 files)

**`src/api/locationsService.ts`** -- Full rewrite
- Replace all axios calls with Supabase SDK queries
- `getStates()` -> `supabase.from('states').select('*').eq('is_active', true).order('name')`
- `getCities({ stateId })` -> filter by `state_id`, `is_active`
- `getAreas({ cityId })` -> filter by `city_id`, `is_active`
- Admin CRUD: create, update, soft delete via `is_active = false`
- Return format uses `id` instead of `_id`

**`src/hooks/useLocations.ts`** -- Adapt to new service
- Remove `response.data.data` nesting (Supabase returns flat arrays)
- Use `id` instead of `_id` in `getLocationById`
- Remove `loadCountries` (country hardcoded as India)
- Load states on mount directly

**`src/components/forms/LocationSelector.tsx`** -- Update
- Remove country dropdown (hardcoded India)
- Use `id` for keys/values instead of `_id`
- Load states on mount instead of requiring country selection

**`src/components/admin/LocationManagement.tsx`** -- Update
- Use new Supabase-based service
- Replace DELETE actions with "Deactivate" (soft delete)
- Remove countries tab (hardcoded India)
- Use `id` instead of `_id`

**`src/components/admin/CabinEditor.tsx`** (Section 9) -- Update
- Remove hardcoded country ID `'684063018f9d4f4736616a42'`
- Use `id` field for location values
- Load states directly without country selection

---

### Phase 3: Slot Booking System (End-to-End)

**A. Student Slot Selection** (`src/components/seats/SeatBookingForm.tsx`)
- When `cabin.slotsEnabled === true` AND slots are loaded:
  - Show slot picker cards (name, time range, price) between duration selection and seat selection
  - Make slot selection mandatory -- block seat selection until slot is chosen
  - Pricing source of truth (centralized):
    - If `slotsEnabled = true` -> use `slot.price` as base monthly price
    - If `slotsEnabled = false` -> use `seat.price` as base price
  - Pass `slot_id` in booking creation payload (already partially wired)
- Cabin-scoped overdue check: before submitting, query `dues` table for pending dues where `cabin_id` matches and `due_amount > paid_amount`. If found, block with "Please clear your pending dues for this reading room"

**B. Slot-Aware Seat Availability** (`src/api/seatsService.ts` and `src/components/seats/DateBasedSeatMap.tsx`)
- Add optional `slotId` prop to `DateBasedSeatMap`
- Update `getAvailableSeatsForDateRange` to accept optional `slotId` parameter
- When `slotId` is provided, filter conflicting bookings by `slot_id` match
- Same seat can be booked by different users in different slots
- Always exclude cancelled bookings (`payment_status NOT IN ('cancelled', 'failed')`)

**C. Admin/Partner Manual Booking** (`src/pages/admin/ManualBookingManagement.tsx`)
- After cabin selection, check `slots_enabled` flag on the selected cabin
- When `slots_enabled = true`:
  - Fetch slots via `cabinSlotService.getSlotsByCabin(cabinId)`
  - Add slot selector between date selection and seat map
  - Use slot price for pricing calculations
  - Pass `slot_id` in manual booking creation payload

**D. Slot Safety** (`src/components/admin/SlotManagement.tsx` and `src/components/admin/CabinEditor.tsx`)
- Slot deletion protection: before deleting, check if bookings reference the `slot_id`. If yes, show error and offer "Deactivate" instead
- Slot toggle locking: when saving cabin, if `slots_enabled` is toggled OFF and active bookings exist with `slot_id`, show warning and prevent toggle

---

### Summary of Files Modified

| File | Changes |
|------|---------|
| Database (4 migrations) | RLS policies, location tables, seed data, slot overlap trigger |
| `src/api/locationsService.ts` | Full rewrite to use Supabase SDK |
| `src/hooks/useLocations.ts` | Adapt to new service format |
| `src/components/forms/LocationSelector.tsx` | Remove country, use `id` |
| `src/components/admin/LocationManagement.tsx` | Supabase + soft delete |
| `src/components/admin/CabinEditor.tsx` | Location fix + slot toggle lock |
| `src/components/seats/SeatBookingForm.tsx` | Slot selection UI + pricing + due check |
| `src/api/seatsService.ts` | Add slotId filter to availability |
| `src/components/seats/DateBasedSeatMap.tsx` | Pass slotId prop |
| `src/pages/admin/ManualBookingManagement.tsx` | Slot selection step |
| `src/components/admin/SlotManagement.tsx` | Deletion protection |

### Implementation Order
1. Database migrations (RLS + location tables + seed + slot trigger)
2. Location service + components rewrite
3. Student slot selection UI + pricing
4. Slot-aware seat availability
5. Admin manual booking slot support
6. Slot deletion protection + toggle locking + due checks

