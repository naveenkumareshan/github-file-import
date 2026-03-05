

# Add "Future Booked" Purple Status to Reading Room Seat Maps

## Problem
Reading room seats with future bookings (starting after the selected date range) appear green ("Available"). Partners and employees cannot see that a seat is already booked for the future, making it hard to make informed decisions.

## Solution
Add the same purple/violet "Future Booked" status used in hostel bed maps to the reading room seat maps.

## Changes

### 1. `src/api/seatsService.ts` — Fetch future bookings alongside current conflicts

In `getAvailableSeatsForDateRange`, after fetching conflicting bookings for the selected range, also query for bookings where `start_date > endDate` (future bookings) for the same cabin. Return a `isFutureBooked` flag on each seat that is currently available but has a future booking.

```typescript
// Additional query for future bookings
const { data: futureBookings } = await supabase.rpc('get_conflicting_seat_bookings', {
  p_cabin_id: cabinId,
  p_start_date: endDate.split('T')[0],
  p_end_date: '2099-12-31',
});
const futureSeatIds = new Set((futureBookings || []).map(b => b.seat_id));

// Mark seats
data: seats.map(s => ({
  ...mapRow(s),
  isAvailable: s.is_available && !bookedSeatIds.has(s.id),
  isFutureBooked: !bookedSeatIds.has(s.id) && futureSeatIds.has(s.id),
}))
```

### 2. `src/components/seats/FloorPlanViewer.tsx` — Purple color for future-booked seats

- Add `isFutureBooked?: boolean` to `ViewerSeat` interface
- In `MemoizedSeatButton`, add a third color branch: if `isFutureBooked && !isBooked`, use `bg-violet-50 border-violet-400 text-violet-800 cursor-pointer`
- Update tooltip to show "Future Booked" status
- Update legend to add purple "Future Booked" entry
- Update minimap dot color to violet for future-booked seats

### 3. `src/components/seats/SeatGridMap.tsx` — Purple color for future-booked seats

- Add `isFutureBooked?: boolean` to `Seat` interface
- In `getSeatStatusColor`, add branch for `isFutureBooked`: `bg-violet-100 text-violet-800 border-violet-400`
- Update tooltip status text
- Add purple legend entry for "Future Booked"

### 4. `src/components/seats/DateBasedSeatMap.tsx` — Pass through future-booked flag

In `transformedSeats`, preserve the `isFutureBooked` flag from the API response. Add a "Future Booked" count badge alongside Available/Unavailable counts.

### Files Changed
- `src/api/seatsService.ts` — Query future bookings, add `isFutureBooked` flag
- `src/components/seats/FloorPlanViewer.tsx` — Purple seat color, legend, minimap
- `src/components/seats/SeatGridMap.tsx` — Purple seat color, legend
- `src/components/seats/DateBasedSeatMap.tsx` — Pass flag through, add badge count

