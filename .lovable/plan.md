

## Two Enhancements for Seat Management

### 1. Allow Future Date Booking on Booked/Expiring Seats

Currently, the booking form only appears when a seat's status is "available". If a seat is currently booked, partners cannot schedule a future booking for it. This change will add a "Book Future Dates" button in the sheet for booked/expiring seats, which opens the same booking form but with the start date defaulting to the day after the current booking ends.

### 2. Date-Range Based Seat Blocking

Currently, blocking a seat sets `is_available = false` globally (no dates). This change will add "Block From" and "Block To" date pickers in the block dialog. The block will be stored with date range in the `seat_block_history` table, and the seat status computation will check these date ranges instead of just the `is_available` flag.

---

### Technical Changes

**Database Migration** -- Add date columns to `seat_block_history`:
- Add `block_from` (date, nullable) and `block_to` (date, nullable) columns to `seat_block_history`
- These store the date range for blocks; when a block has dates, the seat is only blocked for that period

**File: `src/api/vendorSeatsService.ts`**

| Change | Detail |
|--------|--------|
| `toggleSeatAvailability` | Accept optional `blockFrom` and `blockTo` date params; store them in `seat_block_history`; only set `is_available = false` if no date range given (permanent block) |
| `computeDateStatus` | Also check active date-range blocks from `seat_block_history` to determine if seat is blocked for the selected date |
| `getSeatsForDate` | Fetch active date-range blocks alongside bookings; pass to `computeDateStatus` |
| `BlockHistoryEntry` | Add `blockFrom` and `blockTo` fields to the interface |

**File: `src/pages/vendor/VendorSeats.tsx`**

| Change | Detail |
|--------|--------|
| Block dialog (lines 626-653) | Add "Block From" and "Block To" date pickers; pass dates to `toggleSeatAvailability`; only show date pickers when blocking (not unblocking) |
| Booked seat sheet (lines 678-699) | Add a "Book Future Dates" button below the current student info section; clicking it shows the booking form with start date defaulted to day after current booking's end date |
| Booking form visibility (line 772) | Change condition from `dateStatus === 'available'` to also allow when a "future booking mode" flag is set |
| Add state variable | `showFutureBooking` boolean to toggle the booking form for booked seats |
| Block history display | Show block date range (from/to) in block history entries when available |

### User Flow

**Future booking on booked seat:**
1. Partner clicks a booked seat
2. Sheet shows current student info + "Book Future Dates" button
3. Clicking it reveals the standard booking form, start date auto-set to day after current booking ends
4. Partner fills in student, plan, payment details and confirms

**Date-range blocking:**
1. Partner clicks Block on a seat
2. Dialog now shows "Block From" and "Block To" date pickers alongside the reason field
3. Block is recorded with date range; seat shows as blocked only for those dates
4. Block history shows the date range for each entry

