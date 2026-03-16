

## Plan: Three Fixes

### 1. Show Floor in "Room / Seat" columns across reading room booking tables

The floor data is already fetched from the database. It just needs to be displayed in the UI.

**Files to modify:**

- **`src/pages/AdminBookings.tsx`** (line 214): Change display from `${b.cabinId.name} / S${b.seatId.number}` to include floor: `${b.cabinId.name} / Floor ${b.seatId.floor} · S${b.seatId.number}`

- **`src/pages/admin/ExpiringBookingsPage.tsx`** (lines 237-238): Add floor between cabin name and seat number: `{cabin?.name} / Floor {seat?.floor} · Seat {seat?.number}`

- **`src/pages/admin/Receipts.tsx`** and **`src/pages/admin/DueManagement.tsx`**: Same pattern — add floor info wherever Room/Seat is displayed (will check exact lines during implementation).

### 2. Show "Booked On" date AND time in Student Booking View

**File:** `src/pages/students/StudentBookingView.tsx` (line 485)

Change format from `"dd MMM yyyy"` to `"dd MMM yyyy, hh:mm a"` so students can see both date and time of booking.

### 3. Fix Mess Subscription Pause — constrain date picker to subscription period and future dates only

**File:** `src/pages/students/MessDashboard.tsx` (lines 194-195)

Current issue: The "From" date min is just `today`, and "To" date min is just `pauseStart || today`. Students can select dates outside their subscription period.

**Fix:**
- Set `min` for "From" to `max(today, sub.start_date)` — no past dates and no dates before subscription starts
- Set `max` for "From" to `sub.end_date` — can't pause beyond subscription end
- Set `min` for "To" to `pauseStart || max(today, sub.start_date)`
- Set `max` for "To" to `sub.end_date`
- Add validation in `handlePause` to reject if selected dates fall outside the subscription period

