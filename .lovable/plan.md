

## Fix: Seats Overlapping in FloorPlanViewer

### Root Cause
The admin `SeatMapEditor` positions seats at **top-left corner** (`left: x, top: y`) using **32x22px** buttons. But `FloorPlanViewer` (student booking view) **centers** seats (`left: x - seatW/2`) and uses **larger** buttons (36x26 desktop, 47x34 mobile). This centering shift + size increase causes seats to overlap and appear "attached together."

Database proof: Seats 47 (x:562), 52 (x:575), 53 (x:588) are 13-26px apart. A 36px centered button means they collide.

### Fix (single file: `FloorPlanViewer.tsx`)

**1. Match seat positioning to SeatMapEditor**
- Change from centered positioning to top-left positioning:
  - Current: `left: seat.position.x - seatW/2, top: seat.position.y - seatH/2`
  - Fixed: `left: seat.position.x, top: seat.position.y`
- This ensures seats render at exactly the same positions the admin placed them.

**2. Match seat dimensions to SeatMapEditor**
- Use **32x22px** (same as the editor) instead of 36x26 / 47x34.
- On mobile, use a modest scale (e.g. 34x24) to keep touch targets reasonable without causing overlap.

**3. Update bounding box calculation**
- Adjust the bounds `useMemo` to use top-left positioning (no `halfW/halfH` offset) so auto-fit still works correctly.

**4. Update minimap dot positions**
- Ensure minimap dots also use top-left reference for consistency.

### What stays the same
- Auto-fit, pinch-to-zoom, scroll-wheel zoom, pan -- all preserved
- Min zoom = fitScale, max = 3x
- Minimap, legend, tooltip content, seat status colors
- All props and external API

