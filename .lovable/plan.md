

## Beautify the Book Seat Page

A comprehensive UI polish to make the reading room booking page feel more premium and app-like, while keeping all existing features intact.

---

### 1. Hero Section Enhancement (BookSeat.tsx)

- Replace the plain image aspect ratio with a taller, more immersive hero: `aspect-[16/9]` instead of `aspect-[16/10]`
- Add a richer gradient overlay: multi-stop gradient (`from-black/70 via-black/10 to-black/30`) for better text readability
- Add a subtle rating/review display next to the cabin name (stars + review count) if `averageRating` data exists
- Add image counter dots at the bottom of the hero instead of relying only on the slider's built-in counter
- Improve the back button with a slightly larger frosted-glass effect

### 2. Info Chips Redesign (BookSeat.tsx)

- Add subtle colored left borders or icons with accent colors per chip (e.g., green for price, blue for capacity, purple for floors)
- Add a "Locker" chip if locker is available showing the deposit amount
- Slightly increase chip padding and use `shadow-sm` for a lifted feel

### 3. Details and Amenities Section Polish (BookSeat.tsx)

- Use a subtle card-like background (`bg-muted/30 rounded-xl p-3`) to visually separate from the rest
- Replace plain checkmarks with small colored icon badges for amenities
- Add a subtle divider line between description and amenities

### 4. Booking Form Card Redesign (SeatBookingForm.tsx)

- Replace the plain `Card` wrapper with a styled card that has a colored top accent border (`border-t-2 border-t-primary`)
- Add step indicators: small numbered circles (1, 2, 3) for Duration, Seat Selection, and Payment sections
- **Duration selector**: Replace the RadioGroup (which only has one option "Monthly") with a cleaner horizontal pill selector for duration type (Daily/Weekly/Monthly)
- **Duration count + Start date row**: Make them equal width with consistent styling, add subtle background to the row
- **End date remark**: Style it as a small pill/badge instead of plain text (e.g., `bg-primary/10 text-primary rounded-full px-2 py-0.5`)
- **Category filter chips**: Add a small icon or colored dot before each category name for visual distinction

### 5. Seat Map Area (DateBasedSeatMap.tsx)

- Add a subtle header row showing floor tabs with a cleaner pill-style selector instead of basic buttons
- Add an available/total seats counter badge next to the floor selector

### 6. Booking Summary Section (SeatBookingForm.tsx)

- Wrap the summary in a subtle gradient background (`bg-gradient-to-b from-muted/20 to-muted/40 rounded-xl p-4`)
- Use bolder typography for the total amount with a primary color accent
- Add a subtle divider between line items
- Make the "Confirm & Proceed" button full-width with a gradient background and subtle shadow

### 7. Sticky Bottom Bar Enhancement (BookSeat.tsx)

- Add a subtle top shadow/blur effect
- Add a small pulse animation on the "Book Now" button to draw attention
- Use a gradient background instead of plain `bg-background`

### 8. Loading State (BookSeat.tsx)

- Replace the plain spinner with a skeleton loading state showing placeholder shapes for the hero image, chips, and form areas

---

### Technical Details

**Files to modify:**

1. **`src/pages/BookSeat.tsx`**
   - Enhanced hero gradient and aspect ratio
   - Polished info chips with accent colors and icons
   - Amenities section with card-like background
   - Skeleton loading state
   - Enhanced sticky bottom bar with gradient and animation

2. **`src/components/seats/SeatBookingForm.tsx`**
   - Accent border on card
   - Step indicators (numbered circles)
   - Horizontal pill selector for duration type instead of RadioGroup
   - End date styled as a badge
   - Summary section with gradient background
   - Enhanced CTA button styling

3. **`src/components/seats/DateBasedSeatMap.tsx`**
   - Cleaner floor tab styling (pill-style)
   - Seats available counter badge

No functionality changes -- all existing features (seat selection, category filter, coupon, locker, payment flow) remain exactly the same. This is purely visual enhancement.

