

## Fix: Dues Not Appearing in Due Management Table

### Root Cause

The `dues` table has **no foreign key constraints** defined. The `getAllDues` query uses PostgREST relational joins like:
```
.select('*, profiles:user_id(...), cabins:cabin_id(...), seats:seat_id(...), bookings:booking_id(...)')
```

PostgREST requires foreign keys to resolve these joins. Without them, the query errors out silently and returns no data. The summary cards work fine because `getDueSummary` only selects plain columns (`due_amount, paid_amount, status, due_date`) with no joins.

### Fix

**Step 1: Database Migration** -- Add foreign keys to `dues` and `due_payments` tables

```sql
ALTER TABLE public.dues
  ADD CONSTRAINT dues_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  ADD CONSTRAINT dues_cabin_id_fkey FOREIGN KEY (cabin_id) REFERENCES public.cabins(id),
  ADD CONSTRAINT dues_seat_id_fkey FOREIGN KEY (seat_id) REFERENCES public.seats(id),
  ADD CONSTRAINT dues_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id);

ALTER TABLE public.due_payments
  ADD CONSTRAINT due_payments_due_id_fkey FOREIGN KEY (due_id) REFERENCES public.dues(id);
```

This single migration will make the existing `getAllDues` join query work correctly. No frontend code changes needed for this fix -- the query and UI are already correct.

**Step 2: No code changes required** -- The `DueManagement.tsx` component and `vendorSeatsService.ts` queries are already written correctly. They just need the foreign keys to exist so PostgREST can resolve the joins.

### What Will Work After This

- All dues with advance bookings will appear in the Due Management table
- Student name, phone, room name, seat number, booking serial number will all display correctly
- Filters (by room, status, search) will work as expected
- The collect payment flow will continue to work

