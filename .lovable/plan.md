

## Hostel Booking: Future Dates, Advance Duration Control, and Flow Reset on Sharing Change

### 1. Future Check-in Date Selection

**Problem**: Currently check-in is always "today". Users should be able to pick a future date, controlled by a configurable max days setting.

**Database Change**: Add two new columns to the `hostels` table:
- `max_advance_booking_days` (integer, default 30) -- how many days in advance a student can book
- `allowed_durations` (jsonb, default `["daily","weekly","monthly"]`) -- which duration types are offered
- `advance_applicable_durations` (jsonb, default `["daily","weekly","monthly"]`) -- which durations allow advance (partial) payment

**UI Change in Step 2 (HostelRoomDetails.tsx)**:
- Replace the hardcoded "Today" check-in with a date picker
- Default to today, allow selecting up to `hostel.max_advance_booking_days` days into the future
- When a future date is picked, all date calculations (endDate, availability query, booking data) use that date instead of `new Date()`
- Check-out auto-updates based on selected check-in + duration

**Admin/Partner Control**:
- Add `max_advance_booking_days` field to the hostel editor form (partner side) so they can control how far ahead students can book (e.g., 7, 15, 30, 60 days)

### 2. Advance Payment Duration Applicability

**Problem**: Advance payment option should only appear for duration types the partner has enabled (e.g., only monthly, not daily).

**How it works** (mirrors reading room `SeatBookingForm` pattern):
- The `advance_applicable_durations` column on `hostels` stores which durations allow advance payment (e.g., `["monthly"]`)
- In Step 5, the advance payment checkbox only appears if the current `durationType` is in that list AND `advance_booking_enabled` is true
- The `allowed_durations` column controls which duration type pills (Daily/Weekly/Monthly) are shown in Step 2

### 3. Reset Flow When Sharing Type Changes

**Problem**: When a student changes sharing type or category filter, the subsequent steps (duration, bed, package, review) should reset.

**Fix**: In the `setSharingFilter` and `setCategoryFilter` handlers, also reset:
- `setSelectedBed(null)`
- `setSelectedStayPackage(null)`
- `setAgreedToTerms(false)`
- `setUseAdvancePayment(false)`

This forces the student to re-select duration-aware bed, then package, then review -- maintaining the correct flow.

### Files to Change

| File | Action | Description |
|---|---|---|
| Database migration | New | Add `max_advance_booking_days`, `allowed_durations`, `advance_applicable_durations` columns to `hostels` |
| `src/pages/HostelRoomDetails.tsx` | Edit | Add `checkInDate` state with date picker in Step 2; use it for all date calculations; filter duration pills by `allowed_durations`; gate advance payment by `advance_applicable_durations`; reset state on sharing filter change |
| Hostel editor (partner form) | Edit | Add fields for `max_advance_booking_days`, `allowed_durations`, `advance_applicable_durations` |

### Step 2 Updated Layout

```text
Step 2: Stay Duration
[Daily] [Weekly] [Monthly]     <- only pills from allowed_durations shown

Check-in: [Date Picker]        <- defaults to today, max = today + max_advance_booking_days
Duration: [  1  ] month(s)     <- +/- counter
Check-out: [auto-calculated]   <- check-in + duration
```

### Technical Notes

- `checkInDate` state (Date) defaults to `new Date()` and replaces all `new Date()` references in endDate calculation, bed map startDate, and booking payload
- The date picker disables dates before today and after `addDays(today, hostel.max_advance_booking_days || 30)`
- When `checkInDate` changes, `selectedBed` resets (availability may differ)
- Advance payment condition becomes: `hostel.advance_booking_enabled && advanceApplicableDurations.includes(durationType) && advanceAmount < totalPrice`
- Duration pills filtered by: `(hostel.allowed_durations || ['daily','weekly','monthly']).includes(type)`
- Sharing filter change triggers full reset of bed + package + review state

