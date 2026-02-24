

## Restrict Future Booking Date Selection to After Current Booking End Date

### Problem
When using "Book Future Dates" on a booked seat, the start date calendar allows selecting any date -- including dates that are already booked. Users should only be able to pick dates after the current booking's end date.

### Solution
Add a `disabled` prop to the start date Calendar (line 952 in `VendorSeats.tsx`) that, when in future booking mode (`showFutureBooking` is true), disables all dates on or before the current booking's end date.

### Technical Changes

**File: `src/pages/vendor/VendorSeats.tsx`**

| Location | Change |
|----------|--------|
| Start date Calendar (line 952) | Add `disabled` prop: when `showFutureBooking` is true, disable all dates before the day after the current booking's end date. When not in future booking mode, disable dates before today. |

The disabled logic will be:
```
disabled={(date) => {
  if (showFutureBooking && selectedSeat?.currentBooking?.endDate) {
    return date <= new Date(selectedSeat.currentBooking.endDate);
  }
  return date < new Date(new Date().toDateString());
}}
```

This ensures:
- In future booking mode: only dates after the current booking ends are selectable
- In normal booking mode: only today and future dates are selectable
- The auto-set start date (day after current booking end) remains the default

No other file changes are needed.
