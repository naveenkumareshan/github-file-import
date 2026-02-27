

## Enhance BookSeat Page: Image Carousel, Layout, and Conditional Sections

### Changes Overview

**1. Move name/address below the image carousel (not overlaid on it)**
- Remove the name + rating overlay from the hero image section
- Place them below the image as a standalone section with the reading room name, rating, and address (`full_address` from the cabin data)
- Add `full_address` to the Cabin interface and populate it from `d.full_address`

**2. Auto-sliding image carousel (every 3 seconds + manual swipe)**
- Update `CabinImageSlider` to add an `autoPlay` prop (default `false`)
- When `autoPlay` is true, set up a `setInterval` that advances the carousel every 3 seconds
- Pause auto-scroll when user manually interacts (touch/swipe), resume after a delay
- Remove the thumbnail strip on the BookSeat page (keep the dot indicators and slide counter)

**3. Show "Select Seat" step only after plan configuration is done**
- This already works (line 756 in SeatBookingForm: `showSeatSelection` is true when `startDate` and `selectedDuration.count > 0`)
- No change needed here

**4. Hide hero image/details when a seat is selected, show on scroll up**
- Add a `selectedSeat` state-driven collapse: when a seat is selected, the hero image section, info chips, and Details/Amenities card collapse with a smooth animation
- Use CSS transition (max-height + opacity) so the section collapses when seat is selected
- When user scrolls up past the booking form, the section reappears

### Technical Details

#### File: `src/components/CabinImageSlider.tsx`
- Add `autoPlay?: boolean` and `autoPlayInterval?: number` props
- Add `useEffect` with `setInterval` to call `api.scrollNext()` every 3 seconds when `autoPlay` is true
- Clear interval on unmount or when user interacts
- Hide thumbnails when `autoPlay` is true (BookSeat uses full-width hero style)

#### File: `src/pages/BookSeat.tsx`
- Add `address` field to the `Cabin` interface
- Populate it from `d.full_address` in `fetchCabinDetails`
- Move cabin name, rating, and address from the image overlay to a new section below the image
- Remove the gradient text overlay from the hero
- Pass `autoPlay={true}` to `CabinImageSlider`
- Add a `showDetails` state: `true` by default, set to `false` when `selectedSeat` is set
- Use `IntersectionObserver` on the booking form ref: when user scrolls the hero back into view, set `showDetails` back to `true`
- Wrap the hero image, name/address, info chips, and Details/Amenities sections in a collapsible container with CSS transitions

#### Layout after changes (top to bottom):
```text
+----------------------------------+
| [Auto-sliding images]  [< Back]  |
| [Category badge]   [1/3 counter] |
+----------------------------------+
| TRINI STUDY SPACE                |
| 4.5 stars (12 reviews)           |
| 123, Main Road, City, State      |
+----------------------------------+
| [₹900/mo] [16 seats] [2 floors] |
+----------------------------------+
| Details & Amenities              |
| Wi-Fi, Desk, Bookshelf           |
+----------------------------------+
| Configure Your Plan (Step 1)     |
| ...                              |
| Select Your Seat (Step 2)        |  <-- appears after config done
| ...                              |
+----------------------------------+

When seat selected: hero + chips + amenities collapse
When scrolling up: they reappear
```

### Files Changed

| File | Change |
|------|--------|
| `src/components/CabinImageSlider.tsx` | Add `autoPlay` prop with 3-second interval auto-scroll |
| `src/pages/BookSeat.tsx` | Move name/address below image, add address field, add collapse behavior on seat selection, pass autoPlay to slider |
