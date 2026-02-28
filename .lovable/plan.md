

## Fix: Hostel Due Management Page Not Showing Data

### Root Cause
The query in `HostelDueManagement.tsx` uses Supabase join syntax (`profiles:user_id(...)`, `hostels:hostel_id(...)`, etc.), but the `hostel_dues` table has **no foreign key constraints** defined. PostgREST requires foreign keys to resolve these joins, so it returns a 400 error and the page shows "No dues found."

### Solution
**Add foreign key constraints** to the `hostel_dues` table so the existing join query works correctly.

Foreign keys to add:
- `hostel_dues.user_id` -> `profiles.id`
- `hostel_dues.hostel_id` -> `hostels.id`
- `hostel_dues.bed_id` -> `hostel_beds.id`
- `hostel_dues.room_id` -> `hostel_rooms.id`
- `hostel_dues.booking_id` -> `hostel_bookings.id`

### Technical Details

**1. Database migration** - Add foreign keys:
```sql
ALTER TABLE public.hostel_dues
  ADD CONSTRAINT fk_hostel_dues_user FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  ADD CONSTRAINT fk_hostel_dues_hostel FOREIGN KEY (hostel_id) REFERENCES public.hostels(id),
  ADD CONSTRAINT fk_hostel_dues_bed FOREIGN KEY (bed_id) REFERENCES public.hostel_beds(id),
  ADD CONSTRAINT fk_hostel_dues_room FOREIGN KEY (room_id) REFERENCES public.hostel_rooms(id),
  ADD CONSTRAINT fk_hostel_dues_booking FOREIGN KEY (booking_id) REFERENCES public.hostel_bookings(id);
```

**2. No code changes needed** - The existing query in `HostelDueManagement.tsx` is already correct; it just needs the foreign keys to exist for PostgREST to resolve the joins.

**3. Build errors** - The `gl-matrix` type errors are from `node_modules` (a dependency of `maplibre-gl`) and are unrelated. They can be suppressed via `tsconfig.json` `skipLibCheck` if not already set.

