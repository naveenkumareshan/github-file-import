

## Redesign Hostel Details Page to Match Reading Room (BookSeat) Pattern

### Problem
The current hostel detail page (`HostelRoomDetails.tsx`) uses generic Card components with poor layout, inconsistent spacing, and doesn't match the InhaleStays mobile-first design language used in the reading room BookSeat page.

### Design Approach
Replicate the exact pattern from `BookSeat.tsx`: full-width hero image slider at top, then name/rating/address, info chips, details/amenities section, followed by rooms with sharing options. No Card wrappers -- use the clean mobile-first layout.

---

### Changes to `src/pages/HostelRoomDetails.tsx` (Complete Rewrite)

**Layout structure (top to bottom):**

1. **Hero Image Slider** (full-width, auto-playing)
   - Uses `CabinImageSlider` with `autoPlay` and `hideThumbnails` (same as BookSeat)
   - Back button overlay (top-left, rounded, blurred bg)
   - Gender badge (top-right, color-coded: blue=Male, pink=Female, purple=Co-ed)
   - Gradient overlay at top for button visibility

2. **Name, Rating and Location**
   - Hostel name as `text-lg font-bold`
   - Star rating + review count (if available)
   - Location with MapPin icon

3. **Info Chips** (horizontal scrollable row)
   - Starting price (green chip: "From Rs X/mo")
   - Gender (blue chip)
   - Stay type (purple chip: "Long-term" / "Short-term" / "Both")
   - Security deposit if configured (amber chip)
   - Total rooms count

4. **Details and Amenities** (collapsible section)
   - Description text
   - Separator
   - Amenity pills with CheckCircle2 icons (same style as BookSeat)

5. **Rooms and Pricing Section**
   - Section header: "Rooms and Pricing" with subtitle
   - Each room as a bordered section (not a Card):
     - Room image thumbnail + room number, floor, category
     - Room amenities as small badges
     - Sharing options as selectable cards (keep existing design -- it works well)
     - Stay duration packages (shown when a sharing option is selected)
     - Book Now button + contact info for short stays

6. **Bed Map Dialog** and **Image Gallery Dialog** -- keep as-is

7. **Collapsible hero behavior** (same as BookSeat)
   - Hero + details collapse when user scrolls to rooms
   - Sticky header appears with back button + hostel name + "View Details" link
   - Hero reappears when scrolled back to top (IntersectionObserver)

---

### Technical Details

- Remove all `Card`, `CardHeader`, `CardContent`, `CardFooter` wrappers from the main layout
- Use `min-h-screen bg-background pb-24` as root container
- Add skeleton loader matching BookSeat pattern
- Keep all existing state, data fetching, and booking logic unchanged
- Keep `StayDurationPackages`, `HostelBedMap`, and dialog components unchanged
- Use same spacing system: `px-3`, `pt-2`, `gap-1.5`, `text-xs`/`text-sm` typography
- Info chips use same colored bg/text/border pattern as BookSeat (emerald, blue, purple, amber)

### Files Changed

| File | Action |
|---|---|
| `src/pages/HostelRoomDetails.tsx` | Rewrite -- match BookSeat layout pattern |

No new files needed. All existing imports and logic are preserved; only the JSX template and styling change.
