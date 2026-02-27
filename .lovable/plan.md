

## Reduce Column Spacing and Sizes in Booking Tables

### Problem
From the screenshot, the table rows are still tall because:
- The Student column (name + email) takes too much width, pushing other columns
- The Booking ID wraps to 3 lines due to insufficient width
- Cell horizontal padding (`px-3`) adds unnecessary space between columns

### Solution
Reduce horizontal padding and tighten column widths in both Reading Room and Hostel tables.

### Changes

#### 1. `src/pages/AdminBookings.tsx`
- Reduce all TableHead and TableCell horizontal padding from `px-3` to `px-2`
- Truncate student email with a smaller max-width (`max-w-[140px]` instead of `max-w-[180px]`)
- Reduce font size on Booking ID to `text-[10px]` to prevent wrapping
- Reduce Room/Seat font to `text-[10px]`

#### 2. `src/pages/hotelManager/AdminHostelBookings.tsx`
- Same padding reduction: `px-3` to `px-2` on all cells
- Same email truncation and font size reductions

### Files modified: 2
- `src/pages/AdminBookings.tsx`
- `src/pages/hotelManager/AdminHostelBookings.tsx`

