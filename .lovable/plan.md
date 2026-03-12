

# Show Booked Person's Name on Seat/Bed Map Grid Cards

## Problem
The grid cards in both the Seat Control Center (VendorSeats) and Hostel Bed Map only show status labels like "Booked" or "Future Booked" — but not the name of the student who has the booking. Partners want to see at a glance who occupies each seat/bed.

## Changes

### 1. `src/pages/admin/HostelBedMap.tsx` — Grid card (lines ~1251-1266)
After the status label row, add a small truncated name line:
- **Booked / Expiring**: Show `bed.currentBooking.studentName` in `text-[7px]` truncated
- **Future Booked**: Show first future booking's student name from `bed.allBookings[0]?.studentName` in `text-[7px]` truncated, slightly faded

### 2. `src/pages/vendor/VendorSeats.tsx` — Grid card (lines ~939-968)
Same pattern:
- **Booked / Expiring**: Show `seat.currentBooking.studentName` in `text-[7px]` truncated
- **Available with future bookings**: Show first future booking name from `seat.allBookings` that starts after the selected date, in `text-[7px]` faded

Both will be a single line, max-width constrained with `truncate`, using very small text so the card size barely changes.

### Files Modified
- `src/pages/admin/HostelBedMap.tsx` — add student name to grid card
- `src/pages/vendor/VendorSeats.tsx` — add student name to grid card

