

## Show Booking End Date for Booked Seats

### Problem
In the seat detail panel (right-side sheet), the status line shows "Booked for 27 Feb 2026" where "27 Feb 2026" is just the currently selected calendar date, not the actual booking end date. It should show "Booked till [end date]" so the admin/partner knows when the booking expires.

### Fix

**File: `src/pages/vendor/VendorSeats.tsx` (line 911)**

Change the status info display so that:
- When the seat is **booked** or **expiring_soon** and has a `currentBooking`, show: `"till [booking end date]"`
- Otherwise (available/blocked), show: `"for [selected date]"` as it currently does

Current code:
```
<span className="text-muted-foreground ml-auto">for {format(selectedDate, 'dd MMM yyyy')}</span>
```

Updated logic:
```
<span className="text-muted-foreground ml-auto">
  {(selectedSeat.dateStatus === 'booked' || selectedSeat.dateStatus === 'expiring_soon') && selectedSeat.currentBooking
    ? `till ${format(new Date(selectedSeat.currentBooking.endDate), 'dd MMM yyyy')}`
    : `for ${format(selectedDate, 'dd MMM yyyy')}`}
</span>
```

### Files Modified

| File | Change |
|------|--------|
| `src/pages/vendor/VendorSeats.tsx` | Show booking end date ("till X") for booked/expiring seats instead of calendar date |

