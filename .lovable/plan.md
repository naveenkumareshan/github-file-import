

## Fix Seat Layout: Auto-fit, Smart Zoom, Pinch-to-Zoom

### Problem
The `FloorPlanViewer` component uses a fixed `roomWidth`/`roomHeight` (default 800x600), caps zoom at 1.5x on fit, allows zooming out to 0.25x (way past useful), has no pinch-to-zoom, and uses fixed 36x26 seat buttons regardless of device. Result: seats appear tiny on mobile, layout doesn't fill the screen, and users must manually zoom.

### Core Component
`src/components/seats/FloorPlanViewer.tsx` -- this is the single file that needs changes. It powers both the student booking seat map and admin seat views.

### Changes to `FloorPlanViewer.tsx`

**1. Auto-fit based on actual seat bounds (not roomWidth/roomHeight)**
- On mount, compute the bounding box of all seat positions (`minX, minY, maxX, maxY`)
- Use this tight bounding box (+ small padding) instead of the full `roomWidth x roomHeight` for fit calculations
- This eliminates empty margins around the layout

**2. Smart default zoom with 1.15x boost**
- Calculate `fitScale` = container size / seat bounds
- Set initial zoom to `fitScale * 1.15` (slight zoom-in for readability)
- Center the layout by calculating pan offsets to center the bounding box in the viewport

**3. Dynamic min/max zoom**
- `minZoom` = `fitScale` (user cannot zoom out past fit-to-screen)
- `maxZoom` = `3`
- Clamp all zoom operations (buttons + pinch) to this range

**4. Pinch-to-zoom on mobile**
- Track two-finger touch distance in `handleTouchMove`
- When 2 fingers detected, calculate scale delta and apply to zoom (clamped)
- Simultaneously pan to keep pinch center stable

**5. Responsive seat sizing**
- Add a `seatScale` multiplier based on viewport width:
  - Mobile (<768px): `1.3` (larger touch targets)
  - Tablet/Desktop: `1.0`
- Apply to seat button `width`/`height` and font-size via inline style
- Seat dimensions: base 36x26, mobile becomes ~47x34

**6. Scroll-wheel zoom**
- Add `onWheel` handler to container for desktop smooth zoom
- Apply delta to zoom (clamped), adjust pan to keep cursor position stable

**7. Re-fit when seats change**
- Add `seats.length` to the effect dependency for `handleFitToScreen` so switching floors triggers re-fit

### What stays the same
- Minimap, legend, tooltip content, seat status colors
- All props and external API
- `DateBasedSeatMap.tsx` and other consumers unchanged
- `MemoizedSeatButton` memo logic (just adds responsive size)

### Technical approach
- All zoom/pan uses CSS `transform: scale()` -- no re-rendering of seats
- Bounding box computed once per seat array change via `useMemo`
- Pinch gesture uses `getTouchDistance` + `getTouchCenter` helpers
- Performance: no additional DOM elements, just smarter math

