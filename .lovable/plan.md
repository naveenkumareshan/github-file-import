

## Fix Three Seat Management Issues

### Issue 1: Prevent Seat Overlap During Placement

**Problem:** When placing seats on the floor plan, one seat can be placed directly on top of another. There is no collision detection.

**Fix in `src/components/seats/FloorPlanDesigner.tsx`:**
- In `handleCanvasMouseDown` (placement mode branch, ~line 134), after snapping the position to the grid, check if any existing seat already occupies that grid cell (within SEAT_W/SEAT_H distance).
- If overlap detected, show a toast "A seat already exists at this position" and skip placement (don't open the dialog).
- Also add overlap detection in the drag handler (`handleCanvasMouseMove`, ~line 148): when dragging a seat to a new position, check if the snapped target position collides with any other seat. If it does, prevent the move (keep the seat at its last valid position).

**Overlap check logic:**
```text
const isOverlapping = (pos, excludeId?) => 
  seats.some(s => s._id !== excludeId && 
    Math.abs(s.position.x - pos.x) < SEAT_W && 
    Math.abs(s.position.y - pos.y) < SEAT_H);
```

---

### Issue 2: Sync Seat Price Between Seat Map Editor and Seat Generator

**Problem:** When the admin changes a seat's price in the FloorPlanDesigner edit dialog, it doesn't update the AutoSeatGenerator's default price, and vice versa. The prices shown in categories vs individual seat edits can become inconsistent.

**Current behavior:** The AutoSeatGenerator has its own local `price` state (defaults to 2000). The FloorPlanDesigner's SeatEditDialog lets you change price per seat. These are independent.

**Fix in `src/pages/SeatManagement.tsx`:**
- When a seat's price is updated via `handleSeatUpdate`, if the seat's category matches a category in the categories list and the price differs from the category price, update all other seats of the same category to the new price as well. This keeps category-level pricing consistent.
- Alternatively (simpler approach): When a seat's price is changed in the edit dialog, also update the corresponding category's price in the database, so both stay in sync. Then all newly generated seats from AutoSeatGenerator (which uses category prices) will use the updated price.

**Chosen approach:** When editing a seat's price in the SeatEditDialog, if the new price differs from the category price, update the category price in the database too. This ensures the category price is the source of truth.

**Changes:**
- `src/pages/SeatManagement.tsx` - `handleSeatUpdate`: After updating the seat, check if the seat's category price differs from the new price. If so, update the category price via `seatCategoryService.updateCategory` and refresh categories.

---

### Issue 3: Floor 2 Background Image Delete + Save Not Working

**Problem:** When on Floor 2, deleting the background image and saving doesn't work correctly. The `handleSave` function builds `updatedFloors` by setting `layout_image: layoutImage` for the selected floor. When the image is removed, `layoutImage` is set to `null`. However, the `updateCabinLayout` call passes `layoutImage` as a separate parameter too (line 126), and the service function checks `if (layoutImage !== undefined)` which is true for `null`, so it also sets the top-level `layout_image` to `null`, which may interfere.

**Root cause:** The `handleSave` function on line 126 passes the current `layoutImage` state as both: (a) embedded inside the floor's JSONB, and (b) as the top-level `layout_image` column. When deleting the image on floor 2, the top-level `layout_image` also gets set to `null`, which can affect floor 1's fallback.

Additionally, in `useEffect` for floor changes (lines 101-112), when the current floor has no `layout_image`, it falls back to `cabin.layout_image`. But if the previous save wiped `cabin.layout_image`, this fallback breaks.

**Fix:**
- `src/pages/SeatManagement.tsx` - `handleSave` (line 126): Don't pass the per-floor `layoutImage` as the top-level `layout_image` parameter. Only store it in the floors JSONB. Pass `undefined` for `layoutImage` so the top-level column is untouched.
- Change line 126 from:
  ```text
  await adminCabinsService.updateCabinLayout(cabinId, [], roomWidth, roomHeight, 20, [], layoutImage, updatedFloors);
  ```
  to:
  ```text
  await adminCabinsService.updateCabinLayout(cabinId, [], roomWidth, roomHeight, 20, [], undefined, updatedFloors);
  ```
- Also after save, update local `cabin` state with the new floors so that subsequent floor switches use the correct data.

---

### Files Modified

| File | Change |
|------|--------|
| `src/components/seats/FloorPlanDesigner.tsx` | Add overlap detection for seat placement and drag |
| `src/pages/SeatManagement.tsx` | Sync seat price changes to category; fix floor image save logic |

