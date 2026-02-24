

## Fix Seat Alignment, Edit Popup, and Scroll Behavior

### 1. Grid-Snap for Seat Placement and Dragging

Currently seats are placed at arbitrary pixel coordinates, causing misalignment. We will snap all seat positions to a grid (e.g., 40px intervals) so seats always align vertically and horizontally.

**In `FloorPlanDesigner.tsx`:**
- Add a `GRID_SNAP` constant (e.g., 40px)
- Create a `snapToGrid(value)` helper: `Math.round(value / GRID_SNAP) * GRID_SNAP`
- Apply snapping in the placement click handler (where `setPendingSeat` is called)
- Apply snapping in the drag move handler (where seat position updates during drag)
- This ensures every seat lands on a clean grid intersection

### 2. Edit Popup on Existing Seat Click

Currently clicking a seat selects it and shows details in a separate Card below the canvas. Instead, clicking a seat will open an inline dialog/popup with editable category and price fields.

**In `FloorPlanDesigner.tsx`:**
- Add a new `editingSeat` state to track which seat is being edited
- When a seat is clicked (not dragged), set `editingSeat` to that seat
- Create a new `SeatEditDialog` component (similar to `SeatPlacementDialog`) with:
  - Seat number (read-only display)
  - Category selector (radio group from dynamic categories)
  - Price (auto-filled from category, editable)
  - Availability toggle
  - Save and Cancel buttons
- Add a new prop `onSeatUpdate` to handle saving category/price/availability changes
- Distinguish click vs drag: only open edit dialog if the mouse didn't move during mousedown-mouseup

**In `SeatManagement.tsx`:**
- Add a `handleSeatUpdate` function that calls `adminSeatsService.updateSeat`
- Pass it as `onSeatUpdate` prop to `FloorPlanDesigner`
- Remove the separate "Seat Details" Card at the bottom (since editing now happens in the popup)

### 3. Disable Scroll-to-Zoom by Default

Currently the canvas always captures mouse wheel events for zoom, making it impossible to scroll the page. We will only enable wheel-zoom when the user is actively editing (placement mode active or a dedicated "Edit Mode" toggle is on).

**In `FloorPlanDesigner.tsx`:**
- Remove the `onWheel={handleWheel}` from the canvas container by default
- Only attach `onWheel` when `placementMode` is true (user is actively placing/editing seats)
- This allows normal page scrolling when the user is just viewing the layout
- When "Place Seats" is active, scroll-to-zoom works as before for precise placement

---

### Technical Summary

| File | Changes |
|---|---|
| `src/components/seats/FloorPlanDesigner.tsx` | Add grid snapping (40px), add SeatEditDialog for click-to-edit, conditionally attach onWheel only in placement mode |
| `src/pages/SeatManagement.tsx` | Add onSeatUpdate handler, remove bottom Seat Details card |

### Grid Snapping Logic
```text
GRID_SNAP = 40

snapToGrid(value):
  return Math.round(value / GRID_SNAP) * GRID_SNAP

Placement: snap x,y before opening dialog
Dragging:  snap x,y on every mousemove update
```

### Click vs Drag Detection
```text
On mousedown: record startX, startY
On mouseup:   if distance moved < 5px -> it's a click -> open edit dialog
              if distance moved >= 5px -> it's a drag -> save position
```

