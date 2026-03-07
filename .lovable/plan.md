

# Auto-Close Date Pickers on Date Selection

## Problem
All date picker popovers across the app stay open after selecting a date. Standard UX is: pick a date → popover closes automatically.

## Approach
There are ~13 files with `<Popover><Calendar mode="single" /></Popover>` patterns. Instead of adding controlled `open` state to every single instance (tedious, error-prone), I'll take a cleaner approach:

**Create a reusable `DatePicker` component** that wraps `Popover + Calendar` with auto-close built in, then replace all inline Popover+Calendar combos with it.

However, many of these calendars have custom `disabled` logic, custom styling, and different trigger button styles. So the most reliable and least disruptive approach is:

**Add controlled `open`/`onOpenChange` state to each Popover**, and set `open` to `false` inside the `onSelect` callback. This is the standard Shadcn pattern.

## Files to Update (all instances of Popover+Calendar mode="single")

| File | # of date pickers |
|---|---|
| `src/pages/vendor/VendorSeats.tsx` | 5 (selectedDate, blockFrom, blockTo, bookingStart, dueDate) |
| `src/pages/admin/HostelBedMap.tsx` | 4 (selectedDate, bookingStart, dueDate, + others) |
| `src/components/seats/SeatBookingForm.tsx` | 1 (startDate) |
| `src/pages/HostelRoomDetails.tsx` | 1 (checkInDate) |
| `src/pages/MessDetail.tsx` | Already implemented ✓ |
| `src/pages/partner/MyPromotions.tsx` | 1 |
| `src/pages/admin/SponsoredListings.tsx` | 2 (startDate, endDate) |
| `src/components/hostels/DateBasedBedMap.tsx` | 2 (startDate, endDate) |
| `src/pages/BookSharedRoom.tsx` | 1 |
| `src/components/seats/DateBasedSeatMap.tsx` | likely 1-2 |
| `src/components/admin/BookingUpdateDatesDialog.tsx` | likely 1-2 |
| `src/components/admin/BookingExtensionDialog.tsx` | likely 1 |
| `src/components/common/DateFilterSelector.tsx` | likely 1-2 |

## Pattern Applied to Each

**Before:**
```tsx
<Popover>
  <PopoverTrigger asChild><Button>...</Button></PopoverTrigger>
  <PopoverContent>
    <Calendar mode="single" selected={date} onSelect={setDate} />
  </PopoverContent>
</Popover>
```

**After:**
```tsx
const [dateOpen, setDateOpen] = useState(false);

<Popover open={dateOpen} onOpenChange={setDateOpen}>
  <PopoverTrigger asChild><Button>...</Button></PopoverTrigger>
  <PopoverContent>
    <Calendar mode="single" selected={date} onSelect={(d) => { setDate(d); setDateOpen(false); }} />
  </PopoverContent>
</Popover>
```

Each calendar gets its own boolean state variable (e.g., `startDateOpen`, `endDateOpen`, `blockFromOpen`). The `onSelect` handler closes the popover after setting the value. Existing `disabled` logic and styling remain untouched.

