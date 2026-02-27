

## Reorder Hostel Booking Steps: Duration Before Bed Selection

### Problem
Currently the flow is: Sharing Filter -> Bed Map -> Duration Type -> Package. The user wants duration selection to come BEFORE the bed map so that bed availability is checked based on the selected duration/dates. Only available beds for that period should be shown.

### New Step Order

```text
Step 1: Select Sharing Type & Category (filter pills) -- unchanged
Step 2: Stay Duration Type + Count
  [Daily] [Weekly] [Monthly]  pills
  Duration count input (e.g., "3 months", "5 days", "2 weeks")
  -> Auto-calculates start_date (today) and end_date
Step 3: Select Your Bed (inline bed map)
  -> Bed map now checks availability for the date range from Step 2
  -> Only beds without overlapping bookings are shown as available
Step 4: Choose Package (after bed selected)
  -> Book Now in sticky bottom bar
```

### Changes

**`src/pages/HostelRoomDetails.tsx`** (Edit)
- Move the duration type selector (Daily/Weekly/Monthly pills) from after bed selection to Step 2
- Add a duration count input (number field: "How many days/weeks/months?")
- Compute `startDate` (today) and `endDate` based on duration type + count
- Show duration type + count BEFORE bed map; both are always visible (no longer gated behind `selectedBed`)
- Pass `startDate` and `endDate` to `HostelBedMap` as new props
- Step 3 becomes the bed map; Step 4 becomes packages (only after bed selected)
- Update sticky bottom bar price label to include duration count (e.g., "3 months")

**`src/components/hostels/HostelBedMap.tsx`** (Edit)
- Accept optional `startDate` and `endDate` props
- When provided, query `hostel_bookings` filtered by date overlap: bookings where `start_date <= endDate AND end_date >= startDate` with status `confirmed` or `pending`
- Mark beds with overlapping bookings as unavailable (override `is_available` to false)
- This replaces the current simple "any active booking" check with date-range-aware availability

**`src/components/hostels/HostelFloorView.tsx`** (No change needed -- it already respects `is_available` from the bed data passed by HostelBedMap)

### UI Details for Step 2

```text
Step 2: Stay Duration
[Daily] [Weekly] [Monthly]     <- pill toggle (default: Monthly)

Duration: [  1  ] month(s)     <- number input with +/- buttons
Check-in: Today (27 Feb 2026)  <- auto-calculated, shown as info text
Check-out: 27 Mar 2026         <- auto-calculated based on count
```

- Duration count defaults to 1
- The start date is always today
- End date = today + (count * unit), where unit is 1 day / 7 days / 30 days
- When duration type or count changes, bed map re-fetches availability
- Selected bed resets when duration changes (since availability may change)

### Technical Notes

- The `HostelBedMap` component will add `startDate`/`endDate` to its `useEffect` dependency array to re-fetch when dates change
- The booking overlap query uses the same logic as `hostelBookingService.getAvailableBeds`: `lte('start_date', endDate).gte('end_date', startDate)`
- The duration count and type are passed through to the booking page via navigation state
- No database changes needed -- this is purely a UI reorder + query enhancement

