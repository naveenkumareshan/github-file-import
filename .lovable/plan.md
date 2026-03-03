

# Fix: Booked Seats/Beds Showing as Available + Pre-Payment Safety Check

## Problem
Students see all seats/beds as "available" even when they have active bookings, risking duplicate bookings for the same date/time. Two root causes:

1. **Hostel beds**: The booking data is fetched but only used for tooltip display (`occupantName`), not to override the `is_available` flag
2. **Reading room seats (SeatMap)**: Uses `getSeatsByCabin()` which reads the static `is_available` column without checking the `bookings` table
3. **No safety net**: Neither booking flow re-checks availability right before payment, so two users could book the same seat/bed simultaneously

## Changes

### 1. Fix Hostel Bed Availability -- `src/components/hostels/HostelBedMap.tsx`
Override the `is_available` field using the `bookingMap` that already contains overlapping bookings:

**Line 113** change:
```
is_available: b.is_available,
```
to:
```
is_available: b.is_available && !b.is_blocked && !bookingMap.has(b.id),
```

This ensures any bed with an active overlapping booking renders as "Not Available" (blue).

### 2. Fix Hostel Bed Layout View -- `src/components/hostels/HostelBedLayoutView.tsx`
Same fix at **line 127**:
```
is_available: b.is_available,
```
to:
```
is_available: b.is_available && !b.is_blocked && !bookingMap.has(b.id),
```

### 3. Fix Reading Room SeatMap -- `src/components/SeatMap.tsx`
Add `startDate` and `endDate` props. When provided, use `seatsService.getAvailableSeatsForDateRange()` (which already checks for booking conflicts) instead of `getSeatsByCabin()`.

- Add optional `startDate?: string` and `endDate?: string` to `SeatMapProps`
- In `fetchSeats()`: if both dates are provided, call `seatsService.getAvailableSeatsForDateRange(cabinId, '1', startDate, endDate)` instead of `getSeatsByCabin(cabinId, 1)`
- Re-fetch when `startDate` or `endDate` changes (add to useEffect deps)

### 4. Pass dates from Booking page -- `src/pages/Booking.tsx`
Pass `startDate` and `endDate` to `SeatMap`:
```tsx
<SeatMap
  cabinId={cabinId}
  onSeatSelect={handleSeatSelect}
  selectedSeat={selectedSeat}
  startDate={bookingDate ? format(bookingDate, 'yyyy-MM-dd') : undefined}
  endDate={endDate ? format(endDate, 'yyyy-MM-dd') : undefined}
/>
```

### 5. Pre-payment availability re-check -- `src/components/seats/SeatBookingForm.tsx`
Before creating the booking in `handleCreateBooking()`, add a quick availability check:

```typescript
// Right before bookingsService.createBooking(...)
const availCheck = await seatsService.checkSeatAvailability(
  selectedSeat._id || selectedSeat.id,
  format(startDate, 'yyyy-MM-dd'),
  format(endDate, 'yyyy-MM-dd')
);
if (!availCheck.success || !availCheck.data?.isAvailable) {
  toast({ title: "Seat No Longer Available", description: "This seat was just booked. Please select another.", variant: "destructive" });
  setIsSubmitting(false);
  return;
}
```

### 6. Pre-payment availability re-check -- `src/pages/HostelRoomDetails.tsx`
Before creating the hostel booking in `handleProceedToPayment()`, verify the bed is still free:

```typescript
// Right before hostelBookingService.createBooking(...)
const { data: conflictBookings } = await supabase
  .from('hostel_bookings')
  .select('id')
  .eq('bed_id', selectedBed.id)
  .in('status', ['confirmed', 'pending'])
  .lte('start_date', format(endDate, 'yyyy-MM-dd'))
  .gte('end_date', format(checkInDate, 'yyyy-MM-dd'))
  .limit(1);

if (conflictBookings && conflictBookings.length > 0) {
  toast({ title: "Bed No Longer Available", description: "This bed was just booked. Please select another.", variant: "destructive" });
  setIsProcessing(false);
  return;
}
```

## Files Modified

| File | Change |
|------|--------|
| `src/components/hostels/HostelBedMap.tsx` | Override `is_available` using `bookingMap` |
| `src/components/hostels/HostelBedLayoutView.tsx` | Same booking-aware availability fix |
| `src/components/SeatMap.tsx` | Accept date props, use date-range-aware fetch |
| `src/pages/Booking.tsx` | Pass selected dates to SeatMap |
| `src/components/seats/SeatBookingForm.tsx` | Add pre-booking availability re-check |
| `src/pages/HostelRoomDetails.tsx` | Add pre-booking availability re-check |

