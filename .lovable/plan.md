

# Fix: All Generated Seats Not Visible

## Root Cause

The `AutoSeatGenerator` has a boundary check (line 69) that **silently skips** any seat whose position exceeds `roomWidth` or `roomHeight`:

```typescript
if (x + 32 > roomWidth - gridSize || y + 22 > roomHeight - gridSize) continue;
```

With default room dimensions of 800×600 and a `startY` of ~200, only a handful of rows fit before seats start getting dropped. The user generates e.g. 80 seats but only ~30 appear because the rest fall outside the canvas boundary.

## Fix

**Remove the boundary check** in `AutoSeatGenerator` and instead **auto-expand the room dimensions** to accommodate all generated seats. Additionally, auto-fit the zoom after generation so all seats are visible.

### Changes

| File | Change |
|------|--------|
| `src/components/seats/AutoSeatGenerator.tsx` | Remove the boundary skip on line 69. Instead, calculate the max X/Y needed and return it alongside the seats. |
| `src/components/seats/FloorPlanDesigner.tsx` | After `handleAutoGenerate`, if seats extend beyond current room dimensions, call a new optional `onRoomResize` callback to expand the canvas. |
| `src/pages/SeatManagement.tsx` | Add `onRoomResize` handler that updates `roomWidth`/`roomHeight` state and persists via `adminCabinsService.updateCabinLayout`. |

### Detailed approach

1. **AutoSeatGenerator**: Remove the `continue` on line 69. Let all seats generate regardless of room bounds.

2. **FloorPlanDesigner**: In `handleAutoGenerate`, after placing seats, compute `maxX = max(all seat positions.x) + padding` and `maxY = max(all seat positions.y) + padding`. If these exceed current `roomWidth`/`roomHeight`, call `onRoomResize(newWidth, newHeight)`.

3. **SeatManagement**: Pass an `onRoomResize` prop to `FloorPlanDesigner`. The handler updates `roomWidth`/`roomHeight` state and saves via `adminCabinsService.updateCabinLayout`.

4. **FloorPlanDesigner**: After auto-generation completes, call `handleFitToScreen()` to auto-zoom so all seats are visible.

