

# Booking-Wise Actions for Seats & Beds: Release, Cancel, Transfer, Date Edit

## Problem Summary

Currently in both `VendorSeats.tsx` (Reading Room) and `HostelBedMap.tsx` (Hostel):

1. **Release/Cancel** buttons only act on `currentBookings[0]` — if there are multiple bookings, there's no way to release or cancel a specific one. Future bookings have no release/cancel option at all.
2. **Transfer** also only acts on `currentBookings[0]` — future bookings cannot be transferred.
3. **Hostel Bed Map** has no Release/Cancel buttons at all (only Reading Room has them).
4. **Date edit** for bookings is not available to partners in the map view (`BookingUpdateDatesDialog` exists but is only used in admin booking lists).

## Plan

### 1. Add per-booking Release, Cancel, Transfer buttons to each booking card

**`src/pages/vendor/VendorSeats.tsx`** — In both the `currentBookings.map()` (lines ~1763-1902) and `futureBookings.map()` (lines ~1915-1970) loops, add action buttons per booking card:
- **Release Seat** — `setActionBookingId(b.bookingId); setReleaseDialogOpen(true)`
- **Cancel Booking** — `setActionBookingId(b.bookingId); setCancelDialogOpen(true)`
- **Transfer Seat** — `openTransferDialog(b.bookingId)`
- **Edit Dates** — open `BookingUpdateDatesDialog` for that specific booking

Remove the current top-level Release/Cancel/Transfer buttons (lines ~1187-1227) that only operate on `currentBookings[0]`.

**`src/pages/admin/HostelBedMap.tsx`** — Same pattern:
- In both `currentBookings.map()` (lines ~1681-1752) and `futureBookings.map()` (lines ~1763-1793), add per-booking action buttons for Release Bed, Cancel Booking, Transfer Bed, and Edit Dates.
- Add release/cancel state variables (`releaseDialogOpen`, `cancelDialogOpen`, `actionBookingId`, `actionLoading`) — currently missing from HostelBedMap.
- Add `handleReleaseBed` and `handleCancelBooking` functions using `supabase` to update `hostel_bookings` status (similar to how `vendorSeatsService.releaseSeat`/`cancelBooking` work for reading rooms).
- Add AlertDialog confirmations for release and cancel (currently missing).
- Move the top-level Transfer Bed button (line ~1299) into per-booking cards.

### 2. Add Release/Cancel logic to Hostel Bed Map

New functions in `HostelBedMap.tsx`:

```typescript
const handleReleaseBed = async () => {
  // Update hostel_bookings status to 'terminated', set end_date to today
  await supabase.from('hostel_bookings')
    .update({ status: 'terminated', end_date: format(new Date(), 'yyyy-MM-dd') })
    .eq('id', actionBookingId);
  // Cancel pending hostel_dues
  await supabase.from('hostel_dues')
    .update({ status: 'cancelled' })
    .eq('booking_id', actionBookingId)
    .eq('status', 'pending');
};

const handleCancelBooking = async () => {
  // Update hostel_bookings status to 'cancelled'
  await supabase.from('hostel_bookings')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', actionBookingId);
  // Cancel all pending dues
  await supabase.from('hostel_dues')
    .update({ status: 'cancelled' })
    .eq('booking_id', actionBookingId)
    .eq('status', 'pending');
};
```

### 3. Add Date Edit capability per booking

Import and use the existing `BookingUpdateDatesDialog` component in both:
- `VendorSeats.tsx` — with `bookingType='cabin'`
- `HostelBedMap.tsx` — with `bookingType='hostel'`

Add state: `dateEditBooking` (the selected booking object) and `dateEditOpen` (boolean).

Add an "Edit Dates" button (Calendar/Pencil icon) to each booking card. On click, set `dateEditBooking` and open the dialog.

### 4. Per-booking action buttons UI (same for both files)

Each booking card (current and future) will get a small action row at the bottom:

```tsx
<div className="flex gap-1.5 mt-1 flex-wrap">
  <Button size="sm" variant="outline" className="h-6 text-[9px] px-2 gap-1"
    onClick={() => openTransferDialog(b.bookingId)}>
    <ArrowRightLeft className="h-2.5 w-2.5" /> Transfer
  </Button>
  <Button size="sm" variant="outline" className="h-6 text-[9px] px-2 gap-1"
    onClick={() => { setDateEditBooking(b); setDateEditOpen(true); }}>
    <CalendarIcon className="h-2.5 w-2.5" /> Edit Dates
  </Button>
  <Button size="sm" variant="outline" className="h-6 text-[9px] px-2 gap-1 text-amber-600"
    onClick={() => { setActionBookingId(b.bookingId); setReleaseDialogOpen(true); }}>
    <LogOut className="h-2.5 w-2.5" /> Release
  </Button>
  <Button size="sm" variant="outline" className="h-6 text-[9px] px-2 gap-1 text-destructive"
    onClick={() => { setActionBookingId(b.bookingId); setCancelDialogOpen(true); }}>
    <XCircle className="h-2.5 w-2.5" /> Cancel
  </Button>
</div>
```

## Files Changed

- **`src/pages/vendor/VendorSeats.tsx`** — Move Release/Cancel/Transfer from top-level to per-booking cards; add Edit Dates button + BookingUpdateDatesDialog
- **`src/pages/admin/HostelBedMap.tsx`** — Add Release/Cancel state + handlers + AlertDialogs; move Transfer from top-level to per-booking cards; add Edit Dates button + BookingUpdateDatesDialog

