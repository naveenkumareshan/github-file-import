

## Fix Seat Map Matching, Image Slider, and Student Visibility

### Issues Found

1. **Seats not matching admin layout on student side**: The `seatsService.getAvailableSeatsForDateRange()` filters `.eq('is_available', true)`, so booked seats are hidden entirely instead of shown as disabled. Students see a different layout than what admins created. Also, `mapRow()` doesn't map the `category` column, so seat categories (AC/Non-AC) are lost.

2. **"Cabin view 1" broken image alt text**: In `CabinImageSlider.tsx`, the `<img>` alt text says `Cabin view ${index + 1}` which shows as text when images fail to load. The `images` array in the database is empty `[]` for most cabins, so it falls back to a placeholder but the alt text still shows. The images should be swipable (touch-enabled) -- currently the Carousel component supports this but the parent div in `BookSeat.tsx` wraps it with a fixed aspect ratio and gradient overlay that may interfere with touch events.

3. **Layout image not passed to student seat map**: The `DateBasedSeatMap` component doesn't receive or pass the cabin's `layout_image` to `FloorPlanViewer`. Students see seats on a blank canvas instead of the floor plan image the admin uploaded.

4. **Seat map canvas too small and unstable on mobile**: The `FloorPlanViewer` canvas is fixed at `450px` height. On mobile, panning interferes with back-navigation (touching left edge triggers browser back). The canvas needs touch event handling and should prevent default browser gestures inside the canvas area.

5. **Newly activated rooms not showing to students**: The `Cabins.tsx` page filters `cabin.is_active !== false` client-side, AND the `cabinsService.getAllCabins()` query already filters `.eq('is_active', true)`. Both should work, but `is_booking_active` defaults to `true` which is correct. The issue may be caching or that `images` is empty causing rooms to appear broken.

---

### Plan

#### 1. Fix `seatsService.ts` -- Show ALL seats, mark booked ones

**`getAvailableSeatsForDateRange`**: Remove the `.eq('is_available', true)` filter so ALL seats load. Then mark booked ones as unavailable based on booking conflicts.

**`mapRow`**: Add `category` mapping so seat categories display on student side.

```text
mapRow changes:
  + category: row.category,

getAvailableSeatsForDateRange changes:
  - .eq('is_available', true)  // Remove this filter
  + After fetching bookings, mark seats as available/unavailable
  + Return ALL seats, with isAvailable = false for booked ones
```

#### 2. Fix `CabinImageSlider.tsx` -- Remove broken alt text, ensure swipability

- Change alt text from `Cabin view ${index + 1}` to empty string or just "Room image"
- Remove the `Expand` button overlay that blocks swipe gestures
- Ensure the carousel is touch-swipable by not interfering with pointer events

#### 3. Pass layout image to student seat map

**`BookSeat.tsx`**: Fetch and store `layout_image`, `room_width`, `room_height` from cabin data. Pass to `SeatBookingForm`.

**`SeatBookingForm.tsx`**: Accept `layoutImage`, `roomWidth`, `roomHeight` props and pass them to `DateBasedSeatMap`.

**`DateBasedSeatMap.tsx`**: Accept `layoutImage` prop and pass it to `FloorPlanViewer`.

#### 4. Fix `FloorPlanViewer.tsx` -- Better mobile canvas

- Add touch event handlers (`onTouchStart`, `onTouchMove`, `onTouchEnd`) for mobile panning
- Use `e.stopPropagation()` and `e.preventDefault()` to prevent accidental back-navigation
- Make canvas height responsive: `min-h-[350px] h-[60vh]` instead of fixed 450px
- Auto-fit seats to visible area on initial load

#### 5. Fix newly created rooms showing to students

- Ensure `Cabins.tsx` properly renders rooms with empty images array (use placeholder)
- The `CabinsGrid` component should handle missing images gracefully

---

### Technical Details

| File | Changes |
|---|---|
| `src/api/seatsService.ts` | Add `category` to `mapRow`; fix `getAvailableSeatsForDateRange` to return ALL seats with availability status |
| `src/components/CabinImageSlider.tsx` | Fix alt text, ensure touch-swipe works |
| `src/pages/BookSeat.tsx` | Pass `layoutImage`, `roomWidth`, `roomHeight` from cabin data to `SeatBookingForm` |
| `src/components/seats/SeatBookingForm.tsx` | Accept and forward `layoutImage`, `roomWidth`, `roomHeight` to `DateBasedSeatMap` |
| `src/components/seats/DateBasedSeatMap.tsx` | Accept `layoutImage` prop, pass to `FloorPlanViewer` |
| `src/components/seats/FloorPlanViewer.tsx` | Add touch handlers, responsive height, auto-fit, prevent back-nav gesture |

