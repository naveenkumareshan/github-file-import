

# Fix: Seat Overlap & Show Seat Count

## Problems

1. **Seats overlap**: The Reset Layout uses `SEAT_W + GRID_SNAP` (36+40=76) as spacing, then `snapToGrid` rounds to nearest 40, causing some seats to snap to the **same position**. The auto-generator's `snap()` with 40px grid also collapses close positions.
2. **Seat count not visible**: No indicator showing total seats on the layout.

## Changes

### 1. Fix Reset Layout spacing (`FloorPlanDesigner.tsx`)
- Use **pixel-based spacing without snapping** to prevent overlap: `SEAT_W + 6` (42px) horizontally, `SEAT_H + 6` (32px) vertically
- Remove `snapToGrid` calls from reset positioning — use exact pixel positions so no two seats land on the same spot
- Use a fixed column count matching the user's seatsPerRow (or calculate based on available width)

### 2. Fix Auto-Generator spacing (`AutoSeatGenerator.tsx`)
- Remove `snap()` calls from seat position calculation — the snap function with gridSize=40 collapses seats that are 40px apart into the same position
- Use raw pixel positions: `startX + c * (SEAT_W + 6)` and `startY + r * (SEAT_H + 6)` for tight continuous arrangement

### 3. Show seat count in toolbar (`FloorPlanDesigner.tsx`)
- Add a badge/text next to the Delete All button showing `{seats.length} Seats`

### Files
| File | Change |
|------|--------|
| `src/components/seats/AutoSeatGenerator.tsx` | Remove `snap()` from position calc, use raw pixel positions with tight spacing |
| `src/components/seats/FloorPlanDesigner.tsx` | Fix Reset Layout spacing, remove snapToGrid; add seat count display |

