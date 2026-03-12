

# Fix Timezone Bug — All Times Showing UTC Instead of IST

## Problem
All booking timestamps across the app use `timeZone: 'UTC'` when formatting times, which causes a **5 hour 30 minute offset**. A booking made at 7:00 PM IST displays as 1:30 PM. This affects every page where "Booked On" or timestamp columns appear.

**Root cause**: `fmtDateTime` and `fmtDate` helpers explicitly pass `timeZone: 'UTC'` to `toLocaleDateString` / `toLocaleTimeString`. The `date-fns` `format()` calls are fine (they use browser local time), but the custom `fmtDate`/`fmtDateTime` functions force UTC.

**Note**: Using `timeZone: 'UTC'` is correct for **date-only** fields like `start_date` / `end_date` (which are stored as dates without time, and UTC prevents date shifting). But for **timestamp** fields like `created_at`, it must use IST.

## Changes

### 1. `src/pages/AdminBookings.tsx` — Reading room bookings list
- `fmtDateTime`: Change `timeZone: 'UTC'` to `timeZone: 'Asia/Kolkata'` (used for `created_at` / "Booked On")
- `fmtDate`: Keep `timeZone: 'UTC'` (used for `start_date` / `end_date` date-only fields)

### 2. `src/pages/hotelManager/AdminHostelBookings.tsx` — Hostel bookings list
- `fmtDateTime`: Change `timeZone: 'UTC'` to `timeZone: 'Asia/Kolkata'` (used for `created_at`)
- `fmtDate`: Keep `timeZone: 'UTC'` (date-only fields)

### 3. `src/pages/admin/BookingActivityLog.tsx` — Activity log
- `fmtDateTime`: Already uses no explicit timezone (browser default) — no change needed, already correct.

### 4. `src/utils/currency.ts` — `formatDate` helper
- Keep `timeZone: 'UTC'` — this is only used for date-only booking period display, which is correct.

### 5. No changes needed for `date-fns` `format()` calls
- These already use the browser's local timezone, which will be IST for Indian users. All 14 files using `format(new Date(...), ...)` are already correct.

**Summary**: Two files need a one-line change each — switching `timeZone: 'UTC'` to `timeZone: 'Asia/Kolkata'` only in the `fmtDateTime` function (timestamp display), while leaving `fmtDate` (date-only display) untouched.

