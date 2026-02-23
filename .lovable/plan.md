

## Fix: Floor Plan Designer - Walls, Section Resize, Seat Add/Delete

### Issues Found

1. **No wall elements** -- The toolbar lacks buttons to add Door, Window, Screen, AC, Bath elements. The `roomElements` state exists but has no UI to manage it.
2. **Section resize not working** -- The Section Editor dialog has width/height inputs, but changes only update `local` state. When "Save Section" is clicked, `onUpdate(local)` is called which does update correctly, but the section on the canvas may not reflect changes if the section body area calculation has issues with the height.
3. **No add/delete individual seats** -- Seats can only be generated in bulk via "Generate Seats". There's no button to add a single seat or delete a selected seat from the section.
4. **Deleted seats persist** -- When a section is deleted via `handleDeleteSection`, it calls `onSeatsChange(seats.filter(s => s.sectionId !== id))` which only removes from local state. The actual database records are NOT deleted. When the page reloads, deleted seats reappear. Similarly, "Generate Seats" deletes old seats from DB but the `fetchSeats` call may not properly re-assign section IDs due to a race condition with `sections` state.

### Fixes

#### 1. Add Wall Elements (Door, Window, Screen, AC, Bath)

Add a toolbar dropdown/buttons for wall elements in FloorPlanDesigner. Each element renders as a labeled icon on the canvas, constrained to wall edges. Elements are draggable along walls only. Add edit/delete controls on each element.

**Files:** `FloorPlanDesigner.tsx`

#### 2. Fix Section Resize

The Section Editor dialog width/height inputs work, but the issue is that `handleUpdateSection` updates the sections array correctly. The real problem is that when reducing size, seats outside the new boundary still render. Fix: after resizing, warn or auto-remove seats that fall outside the new boundary. Also ensure the section body height calculation (`section.height - 28`) properly updates.

**Files:** `FloorPlanDesigner.tsx`

#### 3. Add Individual Seat Add/Delete

- Add a "Delete Seat" button in the selected seat details card (SeatManagement.tsx)
- Add an "Add Seat" button inside each seat section on the canvas or in the section editor
- Delete calls `adminSeatsService.deleteSeat()` AND removes from local state
- Add creates a seat at the next available position within the section

**Files:** `FloorPlanDesigner.tsx`, `SeatManagement.tsx`

#### 4. Fix Deleted Seats Persisting

- When deleting a section, also delete its seats from the database (not just local state)
- When generating seats for a section, ensure `fetchSeats` properly re-assigns section IDs by using the LATEST sections state
- Add a `handleDeleteSeat` function that deletes from both DB and local state

**Files:** `SeatManagement.tsx`, `FloorPlanDesigner.tsx`

---

### Technical Details

#### FloorPlanDesigner.tsx Changes

**New toolbar buttons for wall elements:**
```text
[Add Seat Section] [Add Structure] [Add Wall Element v]
                                     - Door
                                     - Window
                                     - Screen
                                     - AC
                                     - Bath
```

**Wall element rendering:**
- Each element renders as a small labeled rectangle (40x30px) with an icon
- Constrained to room edges: Door/Window on any wall, Screen on front wall, AC on top wall
- Draggable along wall edges only
- Click to select, show delete button

**New props needed:**
- `onDeleteSeat: (seatId: string) => void` -- for deleting individual seats from DB
- `onAddSeatToSection: (section: Section) => void` -- for adding a single seat to a section
- `onDeleteSectionWithSeats: (sectionId: string) => void` -- for deleting section + its DB seats

**Section resize fix:**
- When section width/height is reduced in the editor and saved, check if any seats fall outside the new boundary and remove them (with confirmation)

#### SeatManagement.tsx Changes

**New handlers:**
- `handleDeleteSeat(seatId)` -- calls `adminSeatsService.deleteSeat(id)`, removes from local seats state
- `handleAddSeatToSection(section)` -- creates a single seat at the next available grid position within the section
- `handleDeleteSectionWithSeats(sectionId)` -- deletes all section seats from DB, then removes section from state

**Fix `fetchSeats` race condition:**
- Use a ref or pass sections directly to `assignSectionIds` from the latest state, not the stale closure value

**Add "Delete Seat" button** in the selected seat details card

#### RoomWalls.tsx Changes

Keep as-is (already renders proper wall boundaries).

---

### Files Summary

| File | Action |
|---|---|
| `src/components/seats/FloorPlanDesigner.tsx` | Add wall element buttons, wall element rendering/dragging, individual seat delete button on canvas, fix section resize behavior, add `onDeleteSeat`/`onAddSeatToSection`/`onDeleteSectionWithSeats` props |
| `src/pages/SeatManagement.tsx` | Add `handleDeleteSeat`, `handleAddSeatToSection`, `handleDeleteSectionWithSeats` handlers, fix sections race condition in `fetchSeats`, add Delete Seat button in seat details card |

